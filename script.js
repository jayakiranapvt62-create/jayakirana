document.addEventListener("DOMContentLoaded", function () {
  console.log("Jayakirana Store Loaded");
  AOS.init({ duration: 800, once: true });

  let allProducts = [];
  const productsGrid = document.getElementById('products');
  const quickCarousel = document.getElementById('quickCarousel');

  // Hero
  let slideIndex = 0;
  const slides = document.querySelectorAll('.slide');
  window.changeSlide = function(n) {
    slides.forEach(s => s.classList.remove('active'));
    slideIndex = (slideIndex + n + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
  };
  setInterval(() => changeSlide(1), 5000);
  changeSlide(0);

  // Load Products
  fetch('products.json')
    .then(r => { if (!r.ok) throw new Error("products.json missing!"); return r.json(); })
    .then(data => {
      allProducts = data;
      renderProducts(allProducts);
      renderQuickCarousel(allProducts);
      initSearch(allProducts);
    })
    .catch(err => {
      productsGrid.innerHTML = `<p style="color:red; text-align:center;">ERROR: ${err.message}</p>`;
    });

  function renderProducts(list) {
    if (!list.length) {
      productsGrid.innerHTML = '<p style="text-align:center; color:#777;">No products found.</p>';
      return;
    }
    productsGrid.innerHTML = list.map(p => `
      <div class="card" onclick="showDetail(${p.id})">
        ${p.quick ? '<span class="quick-badge">QUICK</span>' : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x180?text=${p.name}'">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
        <div class="branch-list">
          ${Object.entries(p.branches).map(([b, d]) => `
            <p class="branch-avail"><strong>${b.charAt(0).toUpperCase() + b.slice(1)}:</strong> 
              <span style="color:${d.available ? '#27ae60' : '#e74c3c'}">
                ${d.available ? 'Available' : 'Not available'} ${d.qty > 0 ? `(${d.qty})` : ''}
              </span>
            </p>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // Quick Carousel
  let carouselIndex = 0;
  function renderQuickCarousel(items) {
    const quick = items.filter(p => p.quick);
    if (!quick.length) {
      quickCarousel.innerHTML = '<p style="color:#fff; text-align:center;">No quick items</p>';
      return;
    }
    quickCarousel.innerHTML = quick.map(p => `
      <div class="card" style="min-width:250px;" onclick="showDetail(${p.id})">
        ${p.quick ? '<span class="quick-badge">QUICK</span>' : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
      </div>
    `).join('');
    setInterval(() => {
      carouselIndex = (carouselIndex + 1) % quick.length;
      quickCarousel.style.transform = `translateX(-${carouselIndex * 266}px)`;
    }, 3000);
    document.querySelector('.carousel-prev').onclick = () => {
      carouselIndex = (carouselIndex - 1 + quick.length) % quick.length;
      quickCarousel.style.transform = `translateX(-${carouselIndex * 266}px)`;
    };
    document.querySelector('.carousel-next').onclick = () => {
      carouselIndex = (carouselIndex + 1) % quick.length;
      quickCarousel.style.transform = `translateX(-${carouselIndex * 266}px)`;
    };
  }

  // Search with Suggestions
  function initSearch(products) {
    const input = document.getElementById('searchInput');
    const suggestions = document.getElementById('searchSuggestions');
    let index = -1;

    input.addEventListener('input', () => {
      const term = input.value.trim().toLowerCase();
      suggestions.innerHTML = '';
      index = -1;
      if (!term) {
        suggestions.classList.remove('show');
        renderProducts(allProducts);
        return;
      }
      const matches = products.filter(p => 
        p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
      );
      if (matches.length) {
        suggestions.innerHTML = matches.slice(0,5).map(p => 
          `<div class="suggestion-item" onclick="goToProduct(${p.id})">${p.name} <small>(${p.category})</small></div>`
        ).join('');
        suggestions.classList.add('show');
      } else {
        suggestions.classList.remove('show');
      }
      renderProducts(matches);
    });

    input.addEventListener('keydown', e => {
      const items = suggestions.querySelectorAll('.suggestion-item');
      if (e.key === 'ArrowDown') { index = Math.min(index + 1, items.length - 1); highlight(items); }
      else if (e.key === 'ArrowUp') { index = Math.max(index - 1, -1); highlight(items); }
      else if (e.key === 'Enter' && index >= 0) { items[index].click(); }
    });

    function highlight(items) {
      items.forEach((el, i) => el.classList.toggle('active', i === index));
    }

    window.goToProduct = id => { showDetail(id); input.value = ''; suggestions.classList.remove('show'); };
  }

  // Product Detail
  window.showDetail = function(id) {
    const p = allProducts.find(x => x.id === id);
    document.body.innerHTML = `
      <div class="product-detail">
        <button class="back-btn" onclick="history.back()">Back</button>
        <div class="detail-header">
          <img class="product-img" src="${p.image}" onerror="this.src='https://via.placeholder.com/400x300?text=${p.name}'">
          <div class="detail-content">
            <h1>${p.name}</h1>
            <p class="detail-price">₹${p.price}</p>
            <p class="detail-desc">${p.description || 'High quality product'}</p>
            <div class="branch-detail">
              <h3>Availability:</h3>
              ${Object.entries(p.branches).map(([b, d]) => `
                <div class="branch-item">
                  <strong>${b.charAt(0).toUpperCase() + b.slice(1)}:</strong>
                  ${d.available ? 'Available' : 'Not available'} ${d.qty > 0 ? `(${d.qty})` : ''}
                </div>
              `).join('')}
