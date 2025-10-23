const express = require("express");
require("express-async-errors");
require("dotenv").config(); // to load the .env file into the process.env object
const session = require("express-session"); // Тут сидит объект сессия
const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

// создание приложения Express
const app = express();

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" }, // верно для локальной разработки (HTTP).
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));

// // Настройка сессий, Фактически это опции для управления тем, когда сессия записывается на сервер.
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false, // Функция сохранения изменённой сессии - сохранять только если данные сессии изменились
//     saveUninitialized: true, // Функция создания новой сессии - сохранять новую пустую сессию сразу
//   })
// );

app.set("view engine", "ejs");
// app.use(require("body-parser").urlencoded({ extended: true }));

// Body parser middleware нужно подключить до маршрутов
app.use(express.urlencoded({ extended: true })); // для HTML-форм
app.use(express.json()); // для JSON

// secret word handling
// let secretWord = "syzygy"; - storing secretWord as a global variable
app.get("/secretWord", (req, res) => {
  if (!req.session.secretWord) {
    req.session.secretWord = "syzygy";
  }
  res.render("secretWord", { secretWord: req.session.secretWord });
});
app.post("/secretWord", (req, res) => {
  req.session.secretWord = req.body.secretWord;
  res.redirect("/secretWord");
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 5001;

const start = async () => {
  try {
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
