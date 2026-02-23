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

// flash
app.use(require('connect-flash')());

// middleware
app.use((req, res, next) => {
  res.locals.errors = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// routes
app.get('/secretWord', (req, res) => {
  if (!req.session.secretWord) {
    req.session.secretWord = 'syzygy';
  }
  res.render('secretWord', {
    secretWord: req.session.secretWord,
  });
});

app.post('/secretWord', (req, res) => {
  if (req.body.secretWord.toUpperCase()[0] === 'P') {
    req.flash('error', "That word won't work!");
    req.flash('error', "You can't use words that start with p.");
  } else {
    req.session.secretWord = req.body.secretWord;
    req.flash('info', 'The secret word was changed.');
  }

  res.redirect('/secretWord');
});

// error handlers
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
