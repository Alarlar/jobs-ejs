const express = require("express");
require("express-async-errors");
require("dotenv").config();
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");

// --------------------
// Helpers to normalize CJS/ESM exports
// --------------------
const pick = (mod, ...keys) => {
  for (const k of keys) {
    if (mod && typeof mod[k] !== "undefined") return mod[k];
  }
  return mod;
};

// --------------------
// Imports that might be ESM or CJS
// --------------------
const passport = require("passport");
const passportInit = pick(require("./passport/passportInit"), "default");
const storeLocals = pick(require("./middleware/storeLocals"), "default", "storeLocals");
const sessionsRouter = pick(require("./routes/sessionRoutes"), "default", "router");
const auth = pick(require("./middleware/auth"), "default", "auth");
const secretWordRouter = pick(require("./routes/secretWord"), "default", "router");
const dbConnect = pick(require("./db/connect"), "default");

const app = express();
const url = process.env.MONGO_URI;

// --------------------
// View engine
// --------------------
app.set("view engine", "ejs");

// --------------------
// MongoDB session store
// --------------------
const store = new MongoDBStore({ uri: url, collection: "mySessions" });
store.on("error", (error) => console.log(error));

const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" }, // локально HTTP
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParams.cookie.secure = true;
}

app.use(session(sessionParams));
app.use(flash());

// --------------------
// Passport setup
// --------------------
typeof passportInit === "function" ? passportInit() : null;

app.use(passport.initialize());
app.use(passport.session());

// --------------------
// Middleware
// --------------------
if (typeof storeLocals !== "function") {
  console.error("middleware/storeLocals должен экспортировать функцию. Получено:", storeLocals);
  throw new TypeError("storeLocals must be a middleware function");
}
app.use(storeLocals);

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --------------------
// Routes
// --------------------
app.get("/", (req, res) => res.render("index"));

if (typeof sessionsRouter !== "function") {
  console.error("routes/sessionRoutes должен экспортировать Router (функцию). Получено:", sessionsRouter);
  throw new TypeError("sessionsRouter must be an express Router/middleware function");
}
app.use("/sessions", sessionsRouter);

if (typeof auth !== "function") {
  console.error("middleware/auth должен экспортировать функцию. Получено:", auth);
  throw new TypeError("auth must be a middleware function");
}
if (typeof secretWordRouter !== "function") {
  console.error("routes/secretWord должен экспортировать Router (функцию). Получено:", secretWordRouter);
  throw new TypeError("secretWordRouter must be an express Router/middleware function");
}
app.use("/secretWord", auth, secretWordRouter);

// --------------------
// 404 and error
// --------------------
app.use((req, res) => res.status(404).send(`Page ${req.url} not found.`));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

// --------------------
// Start server
// --------------------
const port = process.env.PORT || 5001;

const start = async () => {
  try {
    await dbConnect(process.env.MONGO_URI);
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (e) {
    console.error(e);
  }
};
start();
