/**
 * Error Handling Middleware
 */

function notFound(req, res, next) {
  res.status(404).render('pages/404', {
    title: 'Page Not Found — Yarn & Bloom',
    pageUrl: req.originalUrl,
    activeNav: ''
  });
}

function errorHandler(err, req, res, next) {
  console.error('[Application Error]', err.stack || err.message);

  // Handle Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    if (req.flash) {
      req.flash('error', 'Uploaded file is too large. Maximum allowed size is 5MB.');
    }
    return res.redirect('back');
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    if (req.flash) {
      req.flash('error', err.message || 'Invalid file type. Only JPG, PNG, and WebP images are allowed.');
    }
    return res.redirect('back');
  }

  const statusCode = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).render('pages/500', {
    title: 'Something Went Wrong — Yarn & Bloom',
    statusCode,
    message: isDev ? err.message : 'We encountered an unexpected error while weaving your request. Please try again shortly.',
    errorDetails: isDev ? err.stack : null,
    activeNav: ''
  });
}

module.exports = {
  notFound,
  errorHandler
};
