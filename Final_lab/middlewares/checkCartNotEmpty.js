module.exports = function (req, res, next) {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect("/cart");
  }
  next();
};
