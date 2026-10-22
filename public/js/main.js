document.addEventListener('DOMContentLoaded', () => {
  const favoritesStorageKey = 'yarn-bloom-saved-products';
  const favoriteButtons = document.querySelectorAll('[data-favorite-toggle]');
  const favoriteCounts = document.querySelectorAll('[data-favorites-count]');
  const favoriteStatus = document.querySelector('[data-favorites-status]');
  const favoritesFilter = document.querySelector('[data-favorites-filter]');
  const favoriteFilterLabel = document.querySelector('[data-favorites-filter-label]');
  const favoriteCards = document.querySelectorAll('[data-product-card]');
  const favoritesEmptyState = document.querySelector('[data-favorites-empty]');
  const shopResultsCount = document.querySelector('[data-shop-results-count]');
  const shopResultsSummary = document.querySelector('[data-shop-results-summary]');
  const shopPagination = document.querySelector('[data-shop-pagination]');
  let savedProducts = [];
  let showSavedOnly = false;

  const showFavoritesError = (message, error) => {
    console.error(message, error);
    if (favoriteStatus) favoriteStatus.textContent = 'Your saved pieces could not be updated in this browser.';
  };

  try {
    const storedFavorites = JSON.parse(window.localStorage.getItem(favoritesStorageKey) || '[]');
    if (Array.isArray(storedFavorites)) {
      savedProducts = [...new Set(storedFavorites.filter((slug) => typeof slug === 'string' && slug.length > 0))];
    } else {
      console.warn('Saved products data was not a list; starting with an empty list.');
    }
  } catch (error) {
    showFavoritesError('Could not read saved products from browser storage.', error);
  }

  const renderFavorites = () => {
    favoriteCounts.forEach((count) => {
      count.textContent = String(savedProducts.length);
      count.setAttribute('aria-label', `${savedProducts.length} saved products`);
    });

    favoriteButtons.forEach((button) => {
      const isSaved = savedProducts.includes(button.dataset.productSlug);
      button.classList.toggle('is-saved', isSaved);
      button.setAttribute('aria-pressed', String(isSaved));
      button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${button.dataset.productName} ${isSaved ? 'from' : 'to'} favorites`);
      const icon = button.querySelector('[aria-hidden="true"]');
      if (icon) icon.textContent = isSaved ? '♥' : '♡';
      const label = button.querySelector('[data-favorite-label]');
      if (label) label.textContent = isSaved ? 'Saved to favorites' : 'Save to favorites';
    });

    let visibleCount = 0;
    favoriteCards.forEach((card) => {
      const visible = !showSavedOnly || savedProducts.includes(card.dataset.productSlug);
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    if (favoritesFilter) {
      favoritesFilter.setAttribute('aria-pressed', String(showSavedOnly));
      if (favoriteFilterLabel) favoriteFilterLabel.textContent = showSavedOnly ? 'Show all pieces' : 'Show saved pieces';
    }
    if (favoritesEmptyState) favoritesEmptyState.hidden = !showSavedOnly || visibleCount > 0;
    if (shopPagination) shopPagination.hidden = showSavedOnly;
    if (showSavedOnly && shopResultsCount && shopResultsSummary) {
      shopResultsCount.textContent = `Showing ${visibleCount} saved ${visibleCount === 1 ? 'piece' : 'pieces'} on this page`;
    }
  };

  favoriteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const slug = button.dataset.productSlug;
      const wasSaved = savedProducts.includes(slug);
      savedProducts = wasSaved
        ? savedProducts.filter((savedSlug) => savedSlug !== slug)
        : [...savedProducts, slug];

      try {
        window.localStorage.setItem(favoritesStorageKey, JSON.stringify(savedProducts));
        if (favoriteStatus) favoriteStatus.textContent = wasSaved ? 'Removed from your saved pieces.' : 'Added to your saved pieces.';
      } catch (error) {
        showFavoritesError('Could not save favorites to browser storage.', error);
      }
      renderFavorites();
    });
  });

  if (favoritesFilter) {
    favoritesFilter.addEventListener('click', () => {
      showSavedOnly = !showSavedOnly;
      renderFavorites();
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== favoritesStorageKey) return;
    try {
      const updatedFavorites = JSON.parse(event.newValue || '[]');
      savedProducts = Array.isArray(updatedFavorites)
        ? [...new Set(updatedFavorites.filter((slug) => typeof slug === 'string' && slug.length > 0))]
        : [];
      renderFavorites();
    } catch (error) {
      showFavoritesError('Could not sync saved products from another tab.', error);
    }
  });
  renderFavorites();

  const bagStorageKey = 'yarn-bloom-shopping-bag';
  const bagCounts = document.querySelectorAll('[data-bag-count]');
  const bagPage = document.querySelector('[data-shopping-bag]');
  const bagItems = document.querySelector('[data-bag-items]');
  const bagEmpty = document.querySelector('[data-bag-empty]');
  const bagSummary = document.querySelector('[data-bag-summary]');
  const bagTotal = document.querySelector('[data-bag-total]');
  const bagCheckout = document.querySelector('[data-bag-checkout]');
  const bagStatus = document.querySelector('[data-bag-status]');
  let bagProducts = [];

  const normalizeBagProducts = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => item && typeof item.slug === 'string' && typeof item.name === 'string')
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        price: Math.max(0, Number(item.price) || 0),
        image: typeof item.image === 'string' && item.image.startsWith('/') && !item.image.startsWith('//')
          ? item.image
          : '/images/products/placeholder-1.jpg',
        quantity: Math.min(99, Math.max(1, Number.parseInt(item.quantity, 10) || 1)),
        color: typeof item.color === 'string' ? item.color : 'As pictured',
        availability: item.availability === 'in_stock' ? 'Ready to order' : 'Made to order'
      }));
  };

  try {
    bagProducts = normalizeBagProducts(JSON.parse(window.localStorage.getItem(bagStorageKey) || '[]'));
  } catch (error) {
    console.error('Could not read shopping bag from browser storage.', error);
    if (bagStatus) bagStatus.textContent = 'The shopping bag could not be read from this browser.';
  }

  const moneyLabel = (amount) => new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(amount);

  const saveBag = (message = '') => {
    try {
      window.localStorage.setItem(bagStorageKey, JSON.stringify(bagProducts));
      if (bagStatus && message) bagStatus.textContent = message;
    } catch (error) {
      console.error('Could not save shopping bag to browser storage.', error);
      if (bagStatus) bagStatus.textContent = 'Your bag changed, but could not be saved in this browser.';
    }
    renderBag();
  };

  const renderBag = () => {
    const itemCount = bagProducts.reduce((total, item) => total + item.quantity, 0);
    bagCounts.forEach((count) => {
      count.textContent = String(itemCount);
      count.setAttribute('aria-label', `${itemCount} items in shopping bag`);
    });

    if (!bagPage || !bagItems) return;
    bagItems.replaceChildren();
    bagProducts.forEach((item, index) => {
      const row = document.createElement('article');
      row.className = 'bag-item';

      const image = document.createElement('img');
      image.className = 'bag-item-image';
      image.src = item.image;
      image.alt = item.name;
      row.append(image);

      const details = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.name;
      const color = document.createElement('p');
      color.textContent = `Colour: ${item.color}`;
      const availability = document.createElement('p');
      availability.textContent = item.availability;
      const controls = document.createElement('div');
      controls.className = 'bag-item-controls';
      const quantityLabel = document.createElement('label');
      quantityLabel.htmlFor = `bag-quantity-${index}`;
      quantityLabel.textContent = 'Quantity';
      const quantity = document.createElement('input');
      quantity.id = `bag-quantity-${index}`;
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = '99';
      quantity.step = '1';
      quantity.value = String(item.quantity);
      quantity.setAttribute('aria-label', `Quantity for ${item.name}`);
      quantity.addEventListener('change', () => {
        bagProducts[index].quantity = Math.min(99, Math.max(1, Number.parseInt(quantity.value, 10) || 1));
        saveBag('Bag quantity updated.');
      });
      const remove = document.createElement('button');
      remove.className = 'bag-remove';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        bagProducts.splice(index, 1);
        saveBag(`${item.name} removed from your bag.`);
      });
      controls.append(quantityLabel, quantity, remove);
      details.append(title, color, availability, controls);
      row.append(details);

      const lineTotal = document.createElement('strong');
      lineTotal.className = 'bag-line-total';
      lineTotal.textContent = moneyLabel(item.price * item.quantity);
      row.append(lineTotal);
      bagItems.append(row);
    });

    const hasItems = bagProducts.length > 0;
    if (bagEmpty) bagEmpty.hidden = hasItems;
    if (bagSummary) bagSummary.hidden = !hasItems;
    if (hasItems) {
      const total = bagProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
      bagTotal.textContent = moneyLabel(total);
      const message = [
        'Hello Yarn & Bloom!',
        '',
        'I would like to enquire about the following items in my shopping bag:',
        '',
        ...bagProducts.map((item) => `• ${item.name} — ${item.color} × ${item.quantity} (${moneyLabel(item.price * item.quantity)})`),
        '',
        `Estimated total: ${moneyLabel(total)}`,
        '',
        'Please confirm availability, delivery, and payment details. Thank you!'
      ].join('\n');
      bagCheckout.href = `https://wa.me/${encodeURIComponent(bagPage.dataset.businessNumber)}?${new URLSearchParams({ text: message })}`;
    }
  };

  document.querySelectorAll('[data-add-to-bag]').forEach((button) => {
    button.addEventListener('click', () => {
      const productOrder = button.closest('[data-product-order]');
      const colorInput = productOrder && productOrder.querySelector('[data-product-color]');
      const quantityInput = productOrder && productOrder.querySelector('[data-product-quantity]');
      const colors = button.dataset.productColors ? button.dataset.productColors.split(',').map((color) => color.trim()).filter(Boolean) : [];
      const color = colorInput ? colorInput.value : (colors[0] || 'As pictured');
      const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput ? quantityInput.value : '1', 10) || 1));
      const existingItem = bagProducts.find((item) => item.slug === button.dataset.productSlug && item.color === color);

      if (existingItem) {
        existingItem.quantity = Math.min(99, existingItem.quantity + quantity);
      } else {
        bagProducts.push({
          slug: button.dataset.productSlug,
          name: button.dataset.productName,
          price: Number(button.dataset.productPrice),
          image: button.dataset.productImage,
          quantity,
          color,
          availability: button.dataset.productAvailability
        });
      }

      saveBag(`${button.dataset.productName} added to your bag.`);
    });
  });

  const clearBag = document.querySelector('[data-bag-clear]');
  if (clearBag) {
    clearBag.addEventListener('click', () => {
      bagProducts = [];
      saveBag('Your shopping bag has been cleared.');
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== bagStorageKey) return;
    try {
      bagProducts = normalizeBagProducts(JSON.parse(event.newValue || '[]'));
      renderBag();
    } catch (error) {
      console.error('Could not sync shopping bag from another tab.', error);
      if (bagStatus) bagStatus.textContent = 'The shopping bag could not sync from another tab.';
    }
  });
  renderBag();

  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const newsletterForm = document.querySelector('[data-newsletter-form]');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (event) => {
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value.trim()) {
        event.preventDefault();
        emailInput?.focus();
      }
    });
  }

  const productMainImage = document.querySelector('[data-product-main-image]');
  const productThumbnails = document.querySelectorAll('[data-product-thumbnail]');
  if (productMainImage && productThumbnails.length) {
    productThumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        productMainImage.src = thumbnail.dataset.imageSrc;
        productMainImage.alt = thumbnail.dataset.imageAlt;
        productThumbnails.forEach((item) => {
          const isSelected = item === thumbnail;
          item.classList.toggle('active', isSelected);
          item.setAttribute('aria-pressed', String(isSelected));
        });
      });
    });
  }

  const productOrder = document.querySelector('[data-product-order]');
  const productOrderLink = document.querySelector('[data-product-order-link]');
  if (productOrder && productOrderLink) {
    const colorInput = productOrder.querySelector('[data-product-color]');
    const quantityInput = productOrder.querySelector('[data-product-quantity]');
    const productName = productOrder.dataset.productName;
    const productPrice = Number(productOrder.dataset.productPrice);
    const businessNumber = productOrder.dataset.businessNumber;

    const updateOrderLink = () => {
      const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput.value, 10) || 1));
      quantityInput.value = String(quantity);
      const selectedColor = colorInput.value;
      const subtotal = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0
      }).format(productPrice * quantity);
      const message = [
        'Hello Yarn & Bloom!',
        '',
        'I would like to enquire about ordering this handmade crochet item:',
        '',
        `Product: ${productName}`,
        `Quantity: ${quantity}`,
        `Selected colour: ${selectedColor}`,
        `Estimated subtotal: ${subtotal}`,
        '',
        'Please confirm availability, production time, and delivery options. Thank you!'
      ].join('\n');
      productOrderLink.href = `https://wa.me/${encodeURIComponent(businessNumber)}?${new URLSearchParams({ text: message })}`;
    };

    colorInput.addEventListener('change', updateOrderLink);
    quantityInput.addEventListener('change', updateOrderLink);
    quantityInput.addEventListener('blur', updateOrderLink);
    updateOrderLink();
  }
});
