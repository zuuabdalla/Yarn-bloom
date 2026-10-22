/**
 * Rule-based Gift Recommendation Service for Yarn & Bloom
 * Evaluates user quiz inputs against catalog products to find thoughtful matches.
 * Designed with modular architecture to easily integrate AI recommendations in future.
 */

class GiftRecommendationService {
  /**
   * Parse budget range from quiz value
   * @param {string} budgetKey 
   * @returns {{ min: number, max: number }}
   */
  static parseBudgetRange(budgetKey) {
    switch (budgetKey) {
      case 'under-1500':
        return { min: 0, max: 1500 };
      case '1500-3500':
        return { min: 1500, max: 3500 };
      case '3500-6000':
        return { min: 3500, max: 6000 };
      case 'above-6000':
        return { min: 6000, max: 999999 };
      default:
        return { min: 0, max: 999999 };
    }
  }

  /**
   * Score and recommend products based on quiz responses
   * @param {Array} products - List of active products from database
   * @param {Object} answers - { recipient, occasion, budget, colors, preference }
   * @returns {Array} List of matched products with match reasons and score
   */
  static recommend(products, answers) {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    const {
      recipient = '',
      occasion = '',
      budget = '',
      colors = '',
      preference = ''
    } = answers;

    const budgetRange = this.parseBudgetRange(budget);

    const scoredProducts = products.map(product => {
      let score = 0;
      const reasons = [];
      const productPrice = parseFloat(product.price) || 0;
      const categorySlug = (product.category_slug || '').toLowerCase();
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.detailed_description || '').toLowerCase();
      const productOccasions = (product.occasions || '').toLowerCase();
      const availableColors = (product.available_colors || '').toLowerCase();

      // 1. Category / Preference Match (Weight: 35)
      if (preference && preference !== 'any') {
        if (preference === 'bags' && (categorySlug.includes('bag') || productName.includes('tote') || productName.includes('pouch'))) {
          score += 35;
          reasons.push('Matches your style preference for handmade bags');
        } else if (preference === 'flowers' && (categorySlug.includes('flower') || categorySlug.includes('bouquet') || productName.includes('bloom') || productName.includes('daisy'))) {
          score += 35;
          reasons.push('Features everlasting artisan blooms');
        } else if (preference === 'toys' && (categorySlug.includes('toy') || productName.includes('bear') || productName.includes('bunny') || productName.includes('plush'))) {
          score += 35;
          reasons.push('Includes an adorable heirloom crochet toy');
        } else if (preference === 'combinations' && (categorySlug.includes('set') || categorySlug.includes('box'))) {
          score += 35;
          reasons.push('Curated gift set combining multiple treasures');
        }
      }

      // 2. Budget Match (Weight: 25)
      if (productPrice >= budgetRange.min && productPrice <= budgetRange.max) {
        score += 25;
        reasons.push('Fits comfortably within your specified budget');
      } else if (budgetRange.max < 999999 && productPrice <= budgetRange.max * 1.15) {
        // Close to budget
        score += 15;
      }

      // 3. Recipient Match (Weight: 20)
      if (recipient) {
        const rLower = recipient.toLowerCase();
        if ((rLower.includes('baby') || rLower.includes('child')) && (categorySlug.includes('toy') || productName.includes('bunny') || productName.includes('bear'))) {
          score += 20;
          reasons.push('Hypoallergenic and safe for babies & little ones');
        } else if ((rLower.includes('partner') || rLower.includes('wife') || rLower.includes('girlfriend')) && (categorySlug.includes('flower') || categorySlug.includes('set'))) {
          score += 20;
          reasons.push('A heartfelt romantic keepsake');
        } else if (rLower.includes('mum') || rLower.includes('mother') || rLower.includes('parent')) {
          if (categorySlug.includes('flower') || categorySlug.includes('bag')) {
            score += 20;
            reasons.push('A warm, thoughtful gift mothers cherish');
          }
        } else if (rLower.includes('friend') || rLower.includes('colleague')) {
          if (productPrice <= 2500 || productName.includes('pouch') || productName.includes('daisy')) {
            score += 15;
            reasons.push('A charming and thoughtful friendship gift');
          }
        }
      }

      // 4. Occasion Match (Weight: 15)
      if (occasion) {
        const occLower = occasion.toLowerCase();
        if (productOccasions.includes(occLower)) {
          score += 15;
          reasons.push(`Popular choice for ${occasion}`);
        } else if (occLower.includes('birthday') && (product.is_featured || categorySlug.includes('flower') || categorySlug.includes('set'))) {
          score += 10;
          reasons.push('Celebratory and festive presentation');
        } else if (occLower.includes('anniversary') && (categorySlug.includes('flower') || categorySlug.includes('set'))) {
          score += 15;
          reasons.push('Everlasting symbol of love');
        }
      }

      // 5. Color Palette Preference (Weight: 10)
      if (colors && colors !== 'any') {
        const cLower = colors.toLowerCase();
        if (cLower.includes('pastel') && (availableColors.includes('blush') || availableColors.includes('pink') || availableColors.includes('cream') || availableColors.includes('pastel'))) {
          score += 10;
          reasons.push('Available in gentle pastel tones');
        } else if (cLower.includes('earth') && (availableColors.includes('sage') || availableColors.includes('terracotta') || availableColors.includes('beige') || availableColors.includes('taupe'))) {
          score += 10;
          reasons.push('Crafted in natural botanical & earth tones');
        } else if (cLower.includes('neutral') && (availableColors.includes('cream') || availableColors.includes('white') || availableColors.includes('oatmeal'))) {
          score += 10;
          reasons.push('Elegant warm neutrals');
        }
      }

      // Base points for featured items
      if (product.is_featured) {
        score += 5;
      }

      return {
        ...product,
        matchScore: score,
        matchReasons: reasons.length > 0 ? reasons : ['Handcrafted with premium yarn', 'Fully customizable colours']
      };
    });

    // Filter by minimal threshold and sort by matchScore descending
    const filtered = scoredProducts
      .filter(p => p.matchScore >= 20)
      .sort((a, b) => b.matchScore - a.matchScore);

    return filtered.slice(0, 4); // Return top 4 recommendations
  }
}

module.exports = GiftRecommendationService;
