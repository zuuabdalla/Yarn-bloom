/**
 * Admin Authentication and Authorization Middleware
 */

function isAuthenticated(req, res, next) {
  if (req.session && req.session.adminUser) {
    // Inject adminUser into res.locals for templates
    res.locals.adminUser = req.session.adminUser;
    return next();
  }
  req.flash('error', 'Please log in to access the administration dashboard.');
  return res.redirect('/admin/login');
}

function isGuest(req, res, next) {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

function isSuperAdmin(req, res, next) {
  if (req.session && req.session.adminUser && req.session.adminUser.role === 'superadmin') {
    return next();
  }
  req.flash('error', 'Access denied. Superadmin privileges required.');
  return res.redirect('/admin/dashboard');
}

module.exports = {
  isAuthenticated,
  isGuest,
  isSuperAdmin
};
