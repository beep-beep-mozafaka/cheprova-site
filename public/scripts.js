// Базовый путь к API
const API_BASE = "/api";

// Токен админа
let token = localStorage.getItem("admin_token") || null;

document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  loadMaterials();
  setupAdminButton();
});

// --- Загрузка новостей ---
async function loadNews() {
  const container = document.getElementById("news-list") || document.getElementById("latest-posts");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/news`);
    const news = await res.json();

    container.innerHTML = news.map(n => `
      <article class="post">
        <h3>${escapeHtml(n.title)}</h3>
        <small>${new Date(n.date).toLocaleDateString("ru-RU")}</small>
        <p>${escapeHtml(n.text)}</p>
        ${token ? `<button onclick="deleteNews(${n.id})">Удалить</button>` : ""}
      </article>
    `).join("");
  } catch (err) {
    console.error("Ошибка загрузки новостей:", err);
  }
}

// --- Загрузка материалов ---
async function loadMaterials() {
  const container = document.getElementById("materials-list");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/materials`);
    const mats = await res.json();

    container.innerHTML = mats.map(m => `
      <div class="material-item">
        <b>${escapeHtml(m.title)}</b>
        <a href="/uploads/${m.filename}" target="_blank">Скачать</a>
        ${token ? `<button onclick="deleteMaterial(${m.id})">Удалить</button>` : ""}
      </div>
    `).join("");
  } catch (err) {
    console.error("Ошибка загрузки материалов:", err);
  }
}

// --- Кнопка админа ---
function setupAdminButton() {
  const btn = document.createElement("button");
  btn.textContent = "Админ";
  btn.className = "admin-btn";
  btn.onclick = adminLogin;
  document.body.appendChild(btn);
}

// --- Вход/выход админа ---
async function adminLogin() {
  if (token) {
    if (confirm("Выйти из админ-режима?")) {
      token = null;
      localStorage.removeItem("admin_token");
      loadNews();
      loadMaterials();
    }
    return;
  }

  const password = prompt("Введите пароль администратора:");
  if (!password) return;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (data.success) {
      token = data.token;
      localStorage.setItem("admin_token", token);
      alert("Вы вошли как администратор");
      loadNews();
      loadMaterials();
      showAdminPanel();
    } else {
      alert("Неверный пароль");
    }
  } catch (err) {
    console.error("Ошибка при логине:", err);
  }
}

// --- Админ-панель ---
function showAdminPanel() {
  const panel = document.createElement("div");
  panel.className = "admin-panel";
  panel.innerHTML = `
    <h3>Добавить новость</h3>
    <input id="news-title" placeholder="Заголовок">
    <textarea id="news-text" placeholder="Текст"></textarea>
    <button onclick="addNews()">Добавить</button>
    <hr>
    <h3>Добавить материал</h3>
    <input id="mat-title" placeholder="Название">
    <input type="file" id="mat-file">
    <button onclick="addMaterial()">Загрузить</button>
    <hr>
    <button onclick="closeAdminPanel()">Закрыть</button>
  `;
  document.body.appendChild(panel);
}

function closeAdminPanel() {
  document.querySelector(".admin-panel")?.remove();
}

// --- Добавление новостей ---
async function addNews() {
  const title = document.getElementById("news-title").value.trim();
  const text = document.getElementById("news-text").value.trim();
  if (!title || !text) return alert("Введите заголовок и текст");

  try {
    const res = await fetch(`${API_BASE}/news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ title, text })
    });
    const data = await res.json();
    if (data.success) {
      alert("Новость добавлена");
      loadNews();
    } else {
      alert("Ошибка при добавлении");
    }
  } catch (err) {
    console.error("Ошибка при добавлении новости:", err);
  }
}

// --- Добавление материалов ---
async function addMaterial() {
  const title = document.getElementById("mat-title").value.trim();
  const file = document.getElementById("mat-file").files[0];
  if (!title || !file) return alert("Введите название и выберите файл");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/materials`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      alert("Материал загружен");
      loadMaterials();
    } else {
      alert("Ошибка при загрузке");
    }
  } catch (err) {
    console.error("Ошибка при загрузке материала:", err);
  }
}

// --- Удаление ---
async function deleteNews(id) {
  if (!confirm("Удалить новость?")) return;
  await fetch(`${API_BASE}/news/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  loadNews();
}

async function deleteMaterial(id) {
  if (!confirm("Удалить материал?")) return;
  await fetch(`${API_BASE}/materials/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  loadMaterials();
}

// --- Экранирование HTML ---
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
