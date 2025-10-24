const API_BASE = "/api";
let token = localStorage.getItem("admin_token") || null;

document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  loadMaterials();
  loadHomework();
  loadLinks();
  setupAdminButton();
});

// ========== Новости ==========
async function loadNews() {
  const container = document.getElementById("news-container") || document.getElementById("posts-list");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/news`);
    const news = await res.json();
    container.innerHTML = news.map(n => `
      <article class="post">
        <h3>${escapeHtml(n.title)}</h3>
        <small>${new Date(n.date).toLocaleDateString("ru-RU")}</small>
        <p>${escapeHtml(n.text)}</p>
        ${token ? `<button class="del-btn" onclick="deleteNews(${n.id})">Удалить</button>` : ""}
      </article>
    `).join("") || "<p>Пока нет новостей.</p>";
  } catch (err) {
    console.error("Ошибка загрузки новостей:", err);
  }
}

async function addNews() {
  const title = document.getElementById("news-title").value.trim();
  const text = document.getElementById("news-text").value.trim();
  if (!title || !text) return alert("Введите заголовок и текст");

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
    document.getElementById("add-news-form").reset();
  }
}

async function deleteNews(id) {
  if (!confirm("Удалить новость?")) return;
  await fetch(`${API_BASE}/news/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  loadNews();
}

// ========== Материалы ==========
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
        ${token ? `<button class="del-btn" onclick="deleteMaterial(${m.id})">Удалить</button>` : ""}
      </div>
    `).join("") || "<p>Материалы пока не добавлены.</p>";
  } catch (err) {
    console.error("Ошибка загрузки материалов:", err);
  }
}

async function addMaterial() {
  const title = document.getElementById("material-title").value.trim();
  const file = document.getElementById("material-file").files[0];
  if (!title || !file) return alert("Введите название и выберите файл");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/materials`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token },
    body: formData
  });
  const data = await res.json();
  if (data.success) {
    alert("Материал загружен");
    loadMaterials();
    document.getElementById("add-material-form").reset();
  }
}

async function deleteMaterial(id) {
  if (!confirm("Удалить материал?")) return;
  await fetch(`${API_BASE}/materials/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  loadMaterials();
}

// ========== Для учеников ==========
async function loadHomework() {
  const list = document.getElementById("homework-list");
  if (!list) return;
  // пока нет сервера для заданий — просто заглушка
  list.innerHTML = "<li>Пока нет заданий.</li>";
}

async function loadLinks() {
  const list = document.getElementById("useful-links");
  if (!list) return;
  list.innerHTML = `
    <li><a href="https://uchi.ru" target="_blank">Uchi.ru</a></li>
    <li><a href="https://resh.edu.ru" target="_blank">РЭШ</a></li>
  `;
}

// ========== Авторизация ==========
function setupAdminButton() {
  const btn = document.createElement("button");
  btn.textContent = token ? "Выйти" : "Вход";
  btn.className = "admin-btn";
  btn.onclick = adminLogin;
  document.body.appendChild(btn);
}

async function adminLogin() {
  if (token) {
    if (confirm("Выйти из режима администратора?")) {
      token = null;
      localStorage.removeItem("admin_token");
      location.reload();
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
      location.reload();
    } else {
      alert("Неверный пароль");
    }
  } catch (err) {
    console.error("Ошибка при логине:", err);
  }
}

// ========== Вспомогательное ==========
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
