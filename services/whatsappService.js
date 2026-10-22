/**
 * WhatsApp Ordering and Enquiry Service
 * Generates official wa.me click-to-chat links with URL-encoded messages
 */

const { formatKSh } = require('../utils/money');

class WhatsAppService {
  /**
   * Get the business WhatsApp phone number
   * Strips any '+' or non-digit characters
   * @returns {string}
   */
  static getBusinessNumber() {
    const rawNumber = process.env.WHATSAPP_NUMBER || '254141703242';
    return rawNumber.replace(/[^\d]/g, '');
  }

  /**
   * Construct the final wa.me URL
   * @param {string} messageText 
   * @returns {string}
   */
  static createWhatsAppUrl(messageText) {
    const number = this.getBusinessNumber();
    const encodedText = encodeURIComponent(messageText.trim());
    return `https://wa.me/${number}?text=${encodedText}`;
  }

  /**
   * Build WhatsApp order message for a specific catalog product
   * @param {Object} details 
   * @returns {Object} { text, url }
   */
  static buildProductOrderMessage({
    productName,
    productPrice,
    quantity = 1,
    selectedColor = 'Default / As pictured',
    customization = '',
    customerName = '',
    additionalNotes = '',
    referenceNumber = ''
  }) {
    const subtotal = (parseFloat(productPrice) || 0) * (parseInt(quantity, 10) || 1);
    const subtotalFormatted = formatKSh(subtotal);
    const unitPriceFormatted = formatKSh(productPrice);

    let message = `Hello Yarn & Bloom!\n\n`;
    message += `I would like to enquire about ordering the following handmade crochet item:\n\n`;
    message += `• Product: *${productName}*\n`;
    message += `• Unit Price: ${unitPriceFormatted}\n`;
    message += `• Quantity: ${quantity}\n`;
    message += `• Selected Colour: ${selectedColor}\n`;

    if (customization && customization.trim()) {
      message += `• Customisation: ${customization.trim()}\n`;
    }

    message += `• Estimated Subtotal: *${subtotalFormatted}*\n`;

    if (customerName && customerName.trim()) {
      message += `• My Name: ${customerName.trim()}\n`;
    }

    if (additionalNotes && additionalNotes.trim()) {
      message += `• Additional Notes: ${additionalNotes.trim()}\n`;
    }

    if (referenceNumber) {
      message += `• Reference: ${referenceNumber}\n`;
    }

    message += `\nPlease confirm item availability, final price, production time, and delivery options.\n\nThank you!`;

    return {
      text: message,
      url: this.createWhatsAppUrl(message)
    };
  }

  /**
   * Build WhatsApp message for a custom crochet order enquiry
   * @param {Object} order 
   * @returns {Object} { text, url }
   */
  static buildCustomOrderMessage(order) {
    const {
      referenceNumber,
      customerName,
      categoryName = 'Custom Crochet',
      preferredColors,
      desiredSize,
      designDescription,
      occasion,
      budget,
      requiredDate,
      additionalInstructions
    } = order;

    let message = `Hello Yarn & Bloom!\n\n`;
    message += `I just submitted a custom crochet enquiry on your website.\n`;
    if (referenceNumber) {
      message += `• Reference Code: *${referenceNumber}*\n`;
    }
    message += `• Name: *${customerName}*\n`;
    message += `• Category: ${categoryName}\n`;

    if (preferredColors) {
      message += `• Preferred Colours: ${preferredColors}\n`;
    }
    if (desiredSize) {
      message += `• Desired Size: ${desiredSize}\n`;
    }
    if (occasion) {
      message += `• Occasion: ${occasion}\n`;
    }
    if (budget) {
      message += `• Budget: ${formatKSh(budget)}\n`;
    }
    if (requiredDate) {
      message += `• Required Date: ${requiredDate}\n`;
    }

    message += `• Design Description:\n"${designDescription}"\n`;

    if (additionalInstructions) {
      message += `• Additional Instructions: ${additionalInstructions}\n`;
    }

    message += `\nI understand that this enquiry is subject to your confirmation of final quote, availability, production time, and delivery. Looking forward to discussing this!`;

    return {
      text: message,
      url: this.createWhatsAppUrl(message)
    };
  }

  /**
   * Build WhatsApp message for a personalized Gift Box enquiry
   * @param {Object} giftBox 
   * @returns {Object} { text, url }
   */
  static buildGiftBoxMessage(giftBox) {
    const {
      referenceNumber,
      customerName = '',
      colorTheme,
      recipientName,
      giftMessage,
      occasion,
      maxBudget,
      estimatedTotal,
      selectedItems = []
    } = giftBox;

    let message = `Hello Yarn & Bloom!\n\n`;
    message += `I have created a custom Gift Box on your website:\n\n`;
    if (referenceNumber) {
      message += `• Reference: *${referenceNumber}*\n`;
    }
    if (customerName) {
      message += `• From: ${customerName}\n`;
    }
    if (recipientName) {
      message += `• Recipient: ${recipientName}\n`;
    }
    if (occasion) {
      message += `• Occasion: ${occasion}\n`;
    }
    message += `• Colour Theme: ${colorTheme}\n\n`;

    message += `*Selected Box Items:*\n`;
    if (Array.isArray(selectedItems) && selectedItems.length > 0) {
      selectedItems.forEach((item, idx) => {
        const itemPrice = typeof item.price === 'number' ? formatKSh(item.price) : item.price;
        message += `${idx + 1}. ${item.name} (${itemPrice})\n`;
      });
    } else {
      message += `(Standard gift package)\n`;
    }

    if (giftMessage) {
      message += `\n*Handwritten Card Message:*\n"${giftMessage}"\n`;
    }

    if (maxBudget) {
      message += `\n• Target Budget: ${formatKSh(maxBudget)}\n`;
    }
    message += `• Estimated Total: *${formatKSh(estimatedTotal)}*\n\n`;

    message += `Please confirm availability of items, final price, gift packaging options, and delivery timeline.\n\nThank you!`;

    return {
      text: message,
      url: this.createWhatsAppUrl(message)
    };
  }

  /**
   * Build WhatsApp message for Gift Finder quiz results
   * @param {Object} quizData 
   * @returns {Object} { text, url }
   */
  static buildGiftFinderMessage({ recipient, occasion, budget, preference, recommendedProductName }) {
    let message = `Hello Yarn & Bloom!\n\n`;
    message += `I used your Crochet Gift Finder quiz and would love to ask about your recommendations:\n\n`;
    if (recipient) message += `• Shopping For: ${recipient}\n`;
    if (occasion) message += `• Occasion: ${occasion}\n`;
    if (budget) message += `• Budget: ${budget}\n`;
    if (preference) message += `• Preference: ${preference}\n`;
    if (recommendedProductName) message += `• Matched Product: *${recommendedProductName}*\n`;

    message += `\nCould you please confirm current availability and how to place the order?\n\nThank you!`;

    return {
      text: message,
      url: this.createWhatsAppUrl(message)
    };
  }
}

module.exports = WhatsAppService;
