const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");

// connect-mongo v5/v6 ESM/CJS interop tuzatilgan import:
const MongoStore = require("connect-mongo").default || require("connect-mongo");

const { config } = require("dotenv");
const app = express();

const MONGO_URI = "mongodb://localhost:27017/todo_session_db";
config({ quiet: true });


mongoose
.connect(MONGO_URI)
.then(() => console.log("MongoDB-ga muvaffaqiyatli ulandi"))
.catch((err) => console.error("Baza ulanishida xato:", err));

const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: FRONT_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use(
  session({
    secret: "todo-maxfiy-kalit",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || MONGO_URI,
      collectionName: "todos",
    }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);

app.use((req, res, next) => {
  if (!req.session.todos) {
    req.session.todos = [];
  }
  next();
});

app.get("/api/todos", (req, res) => res.json(req.session.todos));

app.post("/api/todos", (req, res) => {
  const newTodo = { id: Date.now(), text: req.body.text, done: false };
  req.session.todos.push(newTodo);

  req.session.save((err) => {
    if (err) return res.status(500).json({ error: "Sessiyani saqlashda xato" });
    res.status(201).json(newTodo);
  });
});

app.delete("/api/todos/:id", (req, res) => {
  req.session.todos = req.session.todos.filter(
    (t) => t.id !== parseInt(req.params.id),
  );

  req.session.save((err) => {
    if (err)
      return res.status(500).json({ error: "Sessiyani yangilashda xato" });
    res.sendStatus(204);
  });
});

// Matnni tahrirlash va/yoki done holatini almashtirish
app.patch("/api/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todo = req.session.todos.find((t) => t.id === id);

  if (!todo) return res.status(404).json({ error: "Todo topilmadi" });

  if (req.body.text !== undefined) todo.text = req.body.text;
  if (req.body.done !== undefined) todo.done = req.body.done;

  req.session.save((err) => {
    if (err)
      return res.status(500).json({ error: "Sessiyani yangilashda xato" });
    res.json(todo);
  });
});

app.listen(5000, () => console.log("Backend 5000-portda ishladi"));
