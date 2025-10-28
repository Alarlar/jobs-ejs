const storeLocals = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.errors = req.flash("error");
  res.locals.info = req.flash("info");
  next();
};

module.exports = storeLocals;
