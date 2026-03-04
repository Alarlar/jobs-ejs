require('dotenv').config();
require('express-async-errors');

const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Mongo store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'mySessions',
});

store.on('error', function (error) {
  console.log(error);
});

// session config
const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: {
    secure: false,
    sameSite: 'strict',
  },
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sessionParams.cookie.secure = true;
}

app.use(session(sessionParams));
const passport = require('passport');
const passportInit = require('./passport/passportInit');

passportInit();
app.use(passport.initialize());
app.use(passport.session());

// flash
app.use(require('connect-flash')());

app.use(require('./middleware/storeLocals'));
app.get('/', (req, res) => {
  res.render('index');
});
app.use('/sessions', require('./routes/sessionRoutes'));

// middleware
app.use((req, res, next) => {
  res.locals.errors = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// secretWord
const auth = require('./middleware/auth');
const secretWordRouter = require('./routes/secretWord');
app.use('/secretWord', auth, secretWordRouter);

// error handlers
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

// 500
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
  next();
});

const port = process.env.PORT || 3000;

(async () => {
  try {
    await require('./db/connect')(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
})();
