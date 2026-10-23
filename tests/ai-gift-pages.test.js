const ejs = require('ejs');
const path = require('path');

const viewsDirectory = path.join(__dirname, '..', 'views');

function renderPage(file, locals) {
  return ejs.renderFile(path.join(viewsDirectory, file), locals);
}

describe('AI gift builder and finder pages', () => {
  test('shows both AI gift tools in the storefront navigation', async () => {
    const html = await renderPage('partials/header.ejs', {
      activeNav: '',
      settings: {}
    });

    expect(html).toContain('href="/gift-finder"');
    expect(html).toContain('AI Gift Finder');
    expect(html).toContain('href="/gift-box"');
    expect(html).toContain('AI Gift Builder');
  });

  test('renders the finder prompt and its initial state', async () => {
    const html = await renderPage('pages/gift-finder.ejs', {
      answers: null,
      results: null
    });

    expect(html).toContain('AI gift finder');
    expect(html).toContain('name="preference"');
    expect(html).toContain('Find my gift');
  });

  test('renders builder suggestions and preselects recommended products', async () => {
    const html = await renderPage('pages/gift-box.ejs', {
      answers: { recipient: 'Mum', budget: '5000' },
      suggestion: {
        source: 'ai',
        summary: 'A thoughtful handmade set.',
        recommendations: [{
          id: 1,
          name: 'Sage Crochet Tote',
          price: 900,
          matchReasons: ['A practical gift in her favourite colour.']
        }]
      },
      selectedProductIds: ['1'],
      bagItems: [{ id: 1, name: 'Sage Crochet Tote', price: 900 }],
      flowerItems: [],
      toyItems: [],
      otherItems: [],
      formatKSh: amount => `KSh ${amount}`
    });

    expect(html).toContain('A thoughtful handmade set.');
    expect(html).toContain('A practical gift in her favourite colour.');
    expect(html).toContain('name="selected_product_ids" value="1" checked');
    expect(html).toContain('Create my gift box');
  });
});
