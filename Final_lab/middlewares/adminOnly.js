// This middleware checks if the user is an admin.
// It checks if the email in the session is 'admin@shop.com'.
// If the user is an admin, it calls the next middleware.
// Otherwise, it redirects the user to the login page.
module.exports = function (req, res, next) {
    if (req.session.email && req.session.email === "admin@shop.com") {
      return next();
    }
    res.redirect('/login');
  };
  