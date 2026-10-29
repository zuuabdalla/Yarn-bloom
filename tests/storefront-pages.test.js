const ejs = require('ejs');
const path = require('path');

const viewsDirectory = path.join(__dirname, '..', 'views');

function renderPage(file, locals) {
  return ejs.renderFile(path.join(viewsDirectory, file), locals);
}

describe('storefront page content', () => {
  test('shows product-specific care instructions on product details', async () => {
    const careInstructions = 'Spot clean gently and lay flat to dry.';
    const html = await renderPage('pages/product-details.ejs', {
      product: {
        id: 1,
        name: 'Sunday Tote',
        slug: 'sunday-tote',
        price: 3200,
        stock_status: 'in_stock',
        short_description: 'A handmade crochet tote.',
        detailed_description: 'A durable everyday tote.',
        care_instructions: careInstructions,
        available_colors: 'Sage, Cream',
        primary_image: '/images/sunday-tote.svg'
      },
      images: [],
      colorsList: ['Sage', 'Cream'],
      relatedProducts: [],
      reviews: [],
      formatKSh: amount => `KSh ${amount}`,
      defaultWhatsAppUrl: 'https://wa.me/254141703242',
      businessNumber: '254141703242'
    });

    expect(html).toContain(careInstructions);
  });

  test('provides ordering answers and a contact path in the FAQ', async () => {
    const html = await renderPage('pages/faq.ejs', {
      settings: { delivery_info: 'Delivery details are confirmed after enquiry.' }
    });

    expect(html).toContain('How do I place an order?');
    expect(html).toContain('Delivery details are confirmed after enquiry.');
    expect(html).toContain('href="/custom-order"');
    expect(html).toContain('href="/contact"');
  });
});
