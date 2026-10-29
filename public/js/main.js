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
  const bagStatus = document.querySelector('[data-bag-status]');
  let bagProducts = [];

  const normalizeBagProducts = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => item && Number.isSafeInteger(Number(item.productId)) && Number(item.productId) > 0 && typeof item.slug === 'string' && typeof item.name === 'string')
      .map((item) => ({
        productId: Number(item.productId),
        slug: item.slug,
        name: item.name,
        price: Math.max(0, Number(item.price) || 0),
        image: typeof item.image === 'string' && item.image.startsWith('/') && !item.image.startsWith('//')
          ? item.image
          : '/images/moodboard/brand-panel.png',
        quantity: Math.min(99, Math.max(1, Number.parseInt(item.quantity, 10) || 1)),
        color: typeof item.color === 'string' ? item.color : 'As pictured',
        customization: typeof item.customization === 'string' ? item.customization.slice(0, 500) : '',
        availability: item.availability === 'in_stock' ? 'Ready to order' : 'Made to order'
      }));
  };

  try {
    bagProducts = normalizeBagProducts(JSON.parse(window.localStorage.getItem(bagStorageKey) || '[]'));
  } catch (error) {
    console.error('Could not read shopping bag from browser storage.', error);
    if (bagStatus) bagStatus.textContent = 'The shopping bag could not be read from this browser.';
  }

  const moneyLabel = (amount) => `KSh ${new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: 0
  }).format(amount)}`;

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
      const customization = document.createElement('p');
      customization.textContent = item.customization ? `Personalisation: ${item.customization}` : '';
      const controls = document.createElement('div');
      controls.className = 'bag-item-controls';
      const decrease = document.createElement('button');
      decrease.className = 'bag-quantity-button';
      decrease.type = 'button';
      decrease.textContent = '−';
      decrease.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
      decrease.addEventListener('click', () => {
        bagProducts[index].quantity = Math.max(1, bagProducts[index].quantity - 1);
        saveBag('Bag quantity updated.');
      });
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
      const increase = document.createElement('button');
      increase.className = 'bag-quantity-button';
      increase.type = 'button';
      increase.textContent = '+';
      increase.setAttribute('aria-label', `Increase quantity of ${item.name}`);
      increase.addEventListener('click', () => {
        bagProducts[index].quantity = Math.min(99, bagProducts[index].quantity + 1);
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
      controls.append(decrease, quantityLabel, quantity, increase, remove);
      details.append(title, color, availability);
      if (item.customization) details.append(customization);
      details.append(controls);
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
      if (bagTotal) bagTotal.textContent = moneyLabel(total);
    }
  };

  const checkoutForm = document.querySelector('[data-checkout-form]');
  const checkoutItems = checkoutForm && checkoutForm.querySelector('[name="cart_items"]');
  const checkoutSummary = document.querySelector('[data-checkout-summary]');
  const checkoutStatus = document.querySelector('[data-checkout-status]');
  const checkoutSubmit = checkoutForm && checkoutForm.querySelector('[type="submit"]');
  let checkoutQuoteRevision = 0;

  const updateCheckout = () => {
    if (!checkoutForm) return;

    const revision = ++checkoutQuoteRevision;
    const checkoutCart = bagProducts.map(({ productId, quantity, color, customization }) => ({
      productId,
      quantity,
      color,
      customization
    }));
    checkoutItems.value = JSON.stringify(checkoutCart);
    checkoutSubmit.disabled = true;
    checkoutSummary.replaceChildren();

    const delivery = document.createElement('p');
    delivery.textContent = `Delivery: ${moneyLabel(Number(checkoutForm.dataset.deliveryFee) || 0)}`;
    checkoutSummary.append(delivery);

    if (checkoutCart.length === 0) {
      checkoutStatus.textContent = 'Your bag is empty. Add a product from the shop before checkout.';
      return;
    }

    checkoutStatus.textContent = 'Checking your bag and verifying current product prices…';
    const summaryMessage = document.createElement('p');
    summaryMessage.textContent = 'Your verified order total will appear here.';
    checkoutSummary.prepend(summaryMessage);

    fetch('/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: checkoutCart })
    }).then(async (response) => {
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('We could not verify prices right now. Please try again in a moment.');
      }
      if (!response.ok) throw new Error(result.error || 'Your order total could not be verified.');
      if (revision !== checkoutQuoteRevision) return;

      checkoutSummary.replaceChildren();
      result.items.forEach((item) => {
        const row = document.createElement('p');
        row.textContent = `${item.name} — ${item.color} × ${item.quantity}: ${moneyLabel(item.line_total)}`;
        checkoutSummary.append(row);
      });
      const subtotal = document.createElement('p');
      subtotal.textContent = `Subtotal: ${moneyLabel(result.subtotal)}`;
      const deliveryFee = document.createElement('p');
      deliveryFee.textContent = `Delivery: ${moneyLabel(result.deliveryFee)}`;
      const total = document.createElement('strong');
      total.textContent = `Estimated total: ${moneyLabel(result.total)}`;
      checkoutSummary.append(subtotal, deliveryFee, total);
      checkoutStatus.textContent = 'Prices are verified from the current product catalogue.';
      checkoutSubmit.disabled = false;
    }).catch((error) => {
      if (revision !== checkoutQuoteRevision) return;
      console.error('Could not verify checkout prices.', error);
      checkoutStatus.textContent = error.message || 'Your order total could not be verified. Please try again.';
    });
  };

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (event) => {
      const checkoutCart = bagProducts.map(({ productId, quantity, color, customization }) => ({
        productId,
        quantity,
        color,
        customization
      }));
      checkoutItems.value = JSON.stringify(checkoutCart);
      if (checkoutSubmit.disabled || checkoutCart.length === 0) {
        event.preventDefault();
        checkoutStatus.textContent = checkoutCart.length === 0
          ? 'Your bag is empty. Add a product from the shop before checkout.'
          : 'Please wait while we verify your order total.';
      }
    });
  }

  document.querySelectorAll('[data-add-to-bag]').forEach((button) => {
    button.addEventListener('click', () => {
      const productOrder = button.closest('[data-product-order]');
      const colorInput = productOrder && productOrder.querySelector('[data-product-color]');
      const quantityInput = productOrder && productOrder.querySelector('[data-product-quantity]');
      const customizationInput = productOrder && productOrder.querySelector('[data-product-customization]');
      const colors = button.dataset.productColors ? button.dataset.productColors.split(',').map((color) => color.trim()).filter(Boolean) : [];
      const color = colorInput ? colorInput.value : (colors[0] || 'As pictured');
      const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput ? quantityInput.value : '1', 10) || 1));
      const customization = customizationInput ? customizationInput.value.trim().slice(0, 500) : '';
      const productId = Number(button.dataset.productId);
      if (!Number.isSafeInteger(productId) || productId < 1) {
        console.error('Cannot add a product without a valid product ID.');
        if (bagStatus) bagStatus.textContent = 'This product could not be added. Please refresh the page and try again.';
        return;
      }
      const existingItem = bagProducts.find((item) =>
        item.productId === productId && item.color === color && item.customization === customization
      );

      if (existingItem) {
        existingItem.quantity = Math.min(99, existingItem.quantity + quantity);
      } else {
        bagProducts.push({
          productId,
          slug: button.dataset.productSlug,
          name: button.dataset.productName,
          price: Number(button.dataset.productPrice),
          image: button.dataset.productImage,
          quantity,
          color,
          customization,
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
      updateCheckout();

      if (document.querySelector('[data-order-confirmation]')) {
        try {
          window.localStorage.removeItem(bagStorageKey);
          bagProducts = [];
          bagCounts.forEach((count) => {
            count.textContent = '0';
            count.setAttribute('aria-label', '0 items in shopping bag');
          });
        } catch (error) {
          console.error('Could not clear the completed order from browser storage.', error);
        }
      }
    } catch (error) {
      console.error('Could not sync shopping bag from another tab.', error);
      if (bagStatus) bagStatus.textContent = 'The shopping bag could not sync from another tab.';
    }
  });
  renderBag();
  updateCheckout();

  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        navToggle.focus();
      }
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
    const customizationInput = productOrder.querySelector('[data-product-customization]');
    const productName = productOrder.dataset.productName;
    const productPrice = Number(productOrder.dataset.productPrice);
    const businessNumber = productOrder.dataset.businessNumber;

    const updateOrderLink = () => {
      const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput.value, 10) || 1));
      quantityInput.value = String(quantity);
      const selectedColor = colorInput.value;
      const subtotal = moneyLabel(productPrice * quantity);
      const customization = customizationInput ? customizationInput.value.trim().slice(0, 500) : '';
      const message = [
        'Hello Yarn & Bloom!',
        '',
        'I would like to enquire about ordering this handmade crochet item:',
        '',
        `Product: ${productName}`,
        `Quantity: ${quantity}`,
        `Selected colour: ${selectedColor}`,
        `Estimated subtotal: ${subtotal}`,
        ...(customization ? [`Personalisation: ${customization}`] : []),
        '',
        'Please confirm availability, production time, and delivery options. Thank you!'
      ].join('\n');
      productOrderLink.href = `https://wa.me/${encodeURIComponent(businessNumber)}?${new URLSearchParams({ text: message })}`;
    };

    colorInput.addEventListener('change', updateOrderLink);
    quantityInput.addEventListener('change', updateOrderLink);
    quantityInput.addEventListener('blur', updateOrderLink);
    if (customizationInput) customizationInput.addEventListener('input', updateOrderLink);
    updateOrderLink();
  }

  const giftBoxForm = document.querySelector('[data-gift-box-form]');
  if (giftBoxForm) {
    const totalDisplay = giftBoxForm.querySelector('[data-gift-box-total]');
    const giftMessage = giftBoxForm.querySelector('[name="gift_message"]');
    const updateGiftBoxTotal = () => {
      const selectedTotal = [...giftBoxForm.querySelectorAll('[name="selected_product_ids"]:checked')]
        .reduce((total, item) => total + (Number(item.dataset.giftPrice) || 0), 0);
      const estimatedTotal = selectedTotal
        ? selectedTotal + 350 + (giftMessage.value.trim() ? 150 : 0)
        : 0;
      totalDisplay.textContent = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0
      }).format(estimatedTotal);
    };

    giftBoxForm.addEventListener('change', updateGiftBoxTotal);
    giftMessage.addEventListener('input', updateGiftBoxTotal);
    updateGiftBoxTotal();
  }

  const giftFinder = document.querySelector('[data-gift-finder-form]');
  if (giftFinder) {
    const steps = [...giftFinder.querySelectorAll('[data-quiz-step]')];
    const progressItems = [...giftFinder.querySelectorAll('.gift-quiz-progress li')];
    const backButton = giftFinder.querySelector('[data-quiz-back]');
    const nextButton = giftFinder.querySelector('[data-quiz-next]');
    const submitButton = giftFinder.querySelector('[data-quiz-submit]');
    let activeStep = 0;

    const showGiftFinderStep = (index) => {
      activeStep = Math.min(steps.length - 1, Math.max(0, index));
      steps.forEach((step, stepIndex) => {
        step.hidden = stepIndex !== activeStep;
      });
      progressItems.forEach((item, stepIndex) => {
        if (stepIndex === activeStep) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
        item.classList.toggle('is-complete', stepIndex < activeStep);
      });
      backButton.hidden = activeStep === 0;
      nextButton.hidden = activeStep === steps.length - 1;
      submitButton.hidden = activeStep !== steps.length - 1;
    };

    giftFinder.querySelectorAll('[data-gift-answer]').forEach((choice) => {
      choice.addEventListener('click', () => {
        const answer = giftFinder.querySelector(`[name="${choice.dataset.giftAnswer}"]`);
        if (!answer) return;
        answer.value = choice.dataset.giftValue;
        choice.closest('.gift-choice-grid, .gift-budget-options, .gift-color-options')
          .querySelectorAll('.gift-choice')
          .forEach((item) => item.classList.toggle('is-selected', item === choice));
      });
    });

    nextButton.addEventListener('click', () => showGiftFinderStep(activeStep + 1));
    backButton.addEventListener('click', () => showGiftFinderStep(activeStep - 1));
    showGiftFinderStep(0);
  }
});
