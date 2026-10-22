const Contact = require('../models/Contact');
const Admin = require('../models/Admin');
const WhatsAppService = require('../services/whatsappService');

exports.getContactPage = async (req, res, next) => {
  try {
    const settings = await Admin.getSettings();
    const whatsappNumber = WhatsAppService.getBusinessNumber();
    const generalWhatsAppUrl = WhatsAppService.createWhatsAppUrl(
      'Hello Yarn & Bloom! I have a general question about your handmade crochet creations and custom orders.'
    );

    const formData = req.session.formData || {};
    delete req.session.formData;

    res.render('pages/contact', {
      title: 'Contact Us — Yarn & Bloom',
      activeNav: 'contact',
      settings,
      whatsappNumber,
      generalWhatsAppUrl,
      formData
    });
  } catch (error) {
    next(error);
  }
};

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    await Contact.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      subject: subject.trim(),
      message: message.trim()
    });

    req.flash('success', 'Thank you for reaching out! We have received your message and will get back to you shortly.');
    res.redirect('/contact');
  } catch (error) {
    next(error);
  }
};
