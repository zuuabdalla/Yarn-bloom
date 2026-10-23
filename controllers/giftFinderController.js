const Product = require('../models/Product');
const Admin = require('../models/Admin');
const AiGiftService = require('../services/aiGiftService');
const WhatsAppService = require('../services/whatsappService');
const { formatKSh } = require('../utils/money');

exports.getGiftFinderPage = async (req, res, next) => {
  try {
    const settings = await Admin.getSettings();
    res.render('pages/gift-finder', {
      title: 'Crochet Gift Finder Quiz — Yarn & Bloom',
      activeNav: 'gift-finder',
      settings,
      results: null,
      answers: null,
      recommendationSource: null,
      recommendationSummary: null
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const { recipient, occasion, budget, colors, preference } = req.body || req.query;
    const answers = { recipient, occasion, budget, colors, preference };

    const [allProducts, settings] = await Promise.all([
      Product.findAll({ limit: 100 }),
      Admin.getSettings()
    ]);

    const recommendation = await AiGiftService.getGiftFinderRecommendations(allProducts, answers);
    const recommended = recommendation.recommendations;

    // Attach WhatsApp URLs for each recommended product
    const enhancedResults = recommended.map(product => {
      const wa = WhatsAppService.buildGiftFinderMessage({
        recipient,
        occasion,
        budget,
        preference,
        recommendedProductName: product.name
      });
      return {
        ...product,
        whatsappUrl: wa.url
      };
    });

    // Check if this was an AJAX request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        count: enhancedResults.length,
        results: enhancedResults,
        source: recommendation.source,
        summary: recommendation.summary
      });
    }

    res.render('pages/gift-finder', {
      title: 'Recommended Crochet Gifts — Yarn & Bloom',
      activeNav: 'gift-finder',
      settings,
      results: enhancedResults,
      answers,
      recommendationSource: recommendation.source,
      recommendationSummary: recommendation.summary,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};
