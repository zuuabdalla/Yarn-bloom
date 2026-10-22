const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'yarn-bloom-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.businessName = process.env.BUSINESS_NAME || 'Yarn & Bloom';
  res.locals.settings = {};
  res.locals.messages = req.flash();
  next();
});

app.use('/', require('./routes/index'));
app.use('/', require('./routes/productRoutes'));
app.use('/', require('./routes/customOrderRoutes'));
app.use('/', require('./routes/giftBoxRoutes'));
app.use('/', require('./routes/giftFinderRoutes'));
app.use('/', require('./routes/contactRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    await db.testConnection();
  } catch (error) {
    console.warn('[App] Database connection check failed at startup:', error.message);
  }
})();

module.exports = app;
