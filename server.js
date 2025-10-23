const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Настройки ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // пароль зададим на Render
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // секрет для токенов

// --- Пути ---
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// --- Создаём нужные папки, если их нет ---
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Файлы с данными ---
const NEWS_FILE = path.join(DATA_DIR, "news.json");
const MATERIALS_FILE = path.join(DATA_DIR, "materials.json");

// если файлов нет — создаём пустые
if (!fs.existsSync(NEWS_FILE)) fs.writeFileSync(NEWS_FILE, "[]");
if (!fs.existsSync(MATERIALS_FILE)) fs.writeFileSync(MATERIALS_FILE, "[]");

// --- Настройка Express ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/", express.static(PUBLIC_DIR));

// --- Функции для чтения/записи JSON ---
const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- Проверка токена ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Нет авторизации" });

  const token = auth.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: "Неверный токен" });
  }
}

// --- Авторизация (вход) ---
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: "Неверный пароль" });
  }
});

// --- Новости ---
app.get("/api/news", (req, res) => {
  res.json(readJSON(NEWS_FILE));
});

app.post("/api/news", authMiddleware, (req, res) => {
  const { title, text } = req.body;
  if (!title || !text) return res.status(400).json({ message: "Не хватает данных" });

  const news = readJSON(NEWS_FILE);
  const item = { id: Date.now(), title, text, date: new Date().toISOString() };
  news.unshift(item);
  writeJSON(NEWS_FILE, news);
  res.json({ success: true, item });
});

app.delete("/api/news/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  let news = readJSON(NEWS_FILE);
  news = news.filter((n) => n.id !== id);
  writeJSON(NEWS_FILE, news);
  res.json({ success: true });
});

// --- Материалы ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.get("/api/materials", (req, res) => {
  res.json(readJSON(MATERIALS_FILE));
});

app.post("/api/materials", authMiddleware, upload.single("file"), (req, res) => {
  const { title } = req.body;
  if (!title || !req.file) return res.status(400).json({ message: "Не хватает данных" });

  const materials = readJSON(MATERIALS_FILE);
  const item = {
    id: Date.now(),
    title,
    filename: req.file.filename,
    date: new Date().toISOString()
  };
  materials.unshift(item);
  writeJSON(MATERIALS_FILE, materials);
  res.json({ success: true, item });
});

app.delete("/api/materials/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  let materials = readJSON(MATERIALS_FILE);
  materials = materials.filter((m) => m.id !== id);
  writeJSON(MATERIALS_FILE, materials);
  res.json({ success: true });
});

// --- Запуск сервера ---
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
