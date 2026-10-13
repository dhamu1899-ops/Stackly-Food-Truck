/* ============================================================
   STACKLY — main.js (food truck website)
   ============================================================ */
(function () {
  "use strict";

  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navList = document.querySelector(".main-nav > ul");
  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      navList.classList.toggle("open");
      navToggle.classList.toggle("open");
    });
    document.querySelectorAll(".has-dropdown > a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (window.innerWidth <= 900) {
          var dd = a.parentElement.querySelector(".dropdown");
          if (dd) { e.preventDefault(); dd.style.display = dd.style.display === "block" ? "" : "block"; }
        }
      });
    });
  }

  /* ---------- Login state in header ---------- */
  var SESSION_KEY = "stackly_session";
  var getSession = function () {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (err) { return null; }
  };
  var renderSession = function () {
    var s = getSession();
    document.querySelectorAll(".btn-login").forEach(function (b) {
      if (s && s.name) {
        b.textContent = "Hi, " + s.name.split(" ")[0];
        b.classList.add("logged-in");
        b.setAttribute("href", s.role === "admin" ? "admin.html" : "dashboard.html");
      } else {
        b.textContent = "Login";
        b.classList.remove("logged-in");
        b.setAttribute("href", "login.html");
      }
    });
  };
  renderSession();

  /* ---------- Back to top ---------- */
  var backTop = document.querySelector(".back-top");
  if (backTop) {
    window.addEventListener("scroll", function () {
      backTop.classList.toggle("show", window.scrollY > 420);
    });
    backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- Premium section animations (auto stagger, all pages) ----------
     Hidden state is gated behind the .anim-ready class added here — if JS ever
     fails to run, content simply stays visible instead of stuck at opacity 0. */
  try {
    document.documentElement.classList.add("anim-ready");

    var animSel = [
      ".sec-head", ".feat", ".feature", ".menu-item", ".product", ".crew-card",
      ".quote", ".step", ".event-card", ".blog-card", ".gallery-item", ".widget",
      ".info-card", ".addr-card", ".faq-item", ".mp-item", ".insta-grid a",
      ".cat-list li", ".stat", ".contact-card", ".hours"
    ].join(",");
    document.querySelectorAll("section").forEach(function (sec) {
      if (sec.hasAttribute("data-dash-view")) return; /* dashboard panels switch, no scroll anim */
      var n = 0;
      sec.querySelectorAll(animSel).forEach(function (el) {
        if (!el.classList.contains("reveal")) el.classList.add("reveal");
        if (!el.style.transitionDelay) {
          el.style.transitionDelay = (n % 6) * 90 + "ms";
          n++;
        }
      });
    });

    /* ---------- Smooth in-page anchor scrolling ---------- */
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var hashAt = href.indexOf("#");
      if (hashAt < 1) return;
      var target = document.getElementById(href.slice(hashAt + 1));
      if (!target) return;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        try { if (history.replaceState) history.replaceState(null, "", href); } catch (err) {}
      });
    });

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }
    /* safety net: reveal in-view elements even if the observer hasn't fired yet
       (runs once after load, and re-checks while scrolling) */
    var revealInView = function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    };
    window.addEventListener("load", function () { setTimeout(revealInView, 1200); });
    setTimeout(revealInView, 1500);
    var revealTick = false;
    window.addEventListener("scroll", function () {
      if (revealTick) return;
      revealTick = true;
      setTimeout(function () { revealTick = false; revealInView(); }, 180);
    }, { passive: true });
  } catch (err) {
    /* animation setup failed — show everything immediately */
    document.documentElement.classList.remove("anim-ready");
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Home hero slider ---------- */
  var slides = document.querySelectorAll(".hero-slide");
  var dotsWrap = document.querySelector(".hero-dots");
  if (slides.length > 1 && dotsWrap) {
    var current = 0;
    var timer;
    slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Slide " + (i + 1));
      if (i === 0) b.className = "active";
      b.addEventListener("click", function () { show(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = dotsWrap.querySelectorAll("button");
    var show = function (i) {
      slides[current].classList.remove("active");
      dots[current].classList.remove("active");
      current = i;
      slides[current].classList.add("active");
      dots[current].classList.add("active");
    };
    var next = function () { show((current + 1) % slides.length); };
    var restart = function () { clearInterval(timer); timer = setInterval(next, 6000); };
    restart();
  }

  /* ---------- Newsletter forms ---------- */
  document.querySelectorAll(".nl-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type='email']");
      var msg = form.querySelector(".nl-msg");
      if (msg) {
        msg.textContent = "Thanks! You are subscribed to the Stackly newsletter.";
        input.value = "";
        setTimeout(function () { msg.textContent = ""; }, 5000);
      }
    });
  });

  /* ---------- Contact form ---------- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = contactForm.querySelector(".form-msg");
      if (msg) {
        msg.textContent = "Thank you! Your message has been sent — our team will reply within 24 hours.";
        contactForm.reset();
        msg.classList.add("show");
        setTimeout(function () { msg.classList.remove("show"); }, 6000);
      }
    });
  }

  /* ---------- Map popup close ---------- */
  document.querySelectorAll(".map-popup-close").forEach(function (btn) {
    btn.addEventListener("click", function () { btn.closest(".map-popup").style.display = "none"; });
  });

  /* ---------- Gallery lightbox ---------- */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    document.querySelectorAll(".g-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var img = item.querySelector("img");
        if (img && lbImg) {
          lbImg.src = img.src; lbImg.alt = img.alt;
          lightbox.classList.add("open");
        }
      });
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lightbox-close")) lightbox.classList.remove("open");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") lightbox.classList.remove("open"); });
  }

  /* ---------- Menu tabs ---------- */
  var tabBtns = document.querySelectorAll(".tab-btn");
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        tabBtns.forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        var panel = document.querySelector('[data-panel="' + btn.dataset.tab + '"]');
        if (panel) panel.classList.add("active");
      });
    });
  }

  /* ---------- News search ---------- */
  var blogSearch = document.getElementById("blogSearch");
  if (blogSearch) {
    blogSearch.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = blogSearch.querySelector("input").value.trim().toLowerCase();
      var found = 0;
      document.querySelectorAll(".post").forEach(function (post) {
        var hit = !q || post.textContent.toLowerCase().indexOf(q) !== -1;
        post.style.display = hit ? "" : "none";
        if (hit) found++;
      });
      var note = document.getElementById("blogNoResults");
      if (note) note.style.display = found ? "none" : "block";
    });
  }

  /* ============================================================
     SHOP: filtering, sorting, search, cart (localStorage)
     ============================================================ */
  var productsGrid = document.querySelector(".products");

  var rangeWrap = document.querySelector(".range");
  if (rangeWrap) {
    var rMin = rangeWrap.querySelector(".r-min");
    var rMax = rangeWrap.querySelector(".r-max");
    var fill = rangeWrap.querySelector(".range-fill");
    var label = document.querySelector(".price-label");
    var GAP = 50;

    var drawRange = function () {
      var min = Math.min(+rMin.value, +rMax.value - GAP);
      var max = Math.max(+rMax.value, +min + GAP);
      rMin.value = min; rMax.value = max;
      var lo = +rMin.min, hi = +rMin.max;
      var l = ((min - lo) / (hi - lo)) * 100;
      var r = ((max - lo) / (hi - lo)) * 100;
      fill.style.left = l + "%"; fill.style.width = r - l + "%";
      if (label) label.textContent = "Price: " + money(min) + " — " + money(max);
      return [min, max];
    };
    rMin.addEventListener("input", drawRange);
    rMax.addEventListener("input", drawRange);
    drawRange();

    var applyFilters = function () {
      var b = drawRange();
      var s = document.getElementById("shopSearch");
      var q = s ? s.value.trim().toLowerCase() : "";
      var cat = document.querySelector(".cat-list a.active");
      cat = cat ? cat.dataset.cat : "all";
      var visible = 0;
      document.querySelectorAll(".product").forEach(function (p) {
        var price = +p.dataset.price;
        var ok = price >= b[0] && price <= b[1];
        ok = ok && (!q || p.dataset.name.toLowerCase().indexOf(q) !== -1);
        ok = ok && (cat === "all" || p.dataset.category === cat);
        p.style.display = ok ? "" : "none";
        if (ok) visible++;
      });
      var empty = document.querySelector(".shop-empty");
      if (empty) empty.style.display = visible ? "none" : "block";
    };
    var filterBtn = document.querySelector(".btn-filter");
    if (filterBtn) filterBtn.addEventListener("click", applyFilters);
    var shopSearchForm = document.getElementById("shopSearchForm");
    if (shopSearchForm) shopSearchForm.addEventListener("submit", function (e) { e.preventDefault(); applyFilters(); });

    document.querySelectorAll(".cat-list a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelectorAll(".cat-list a").forEach(function (x) { x.classList.remove("active"); });
        a.classList.add("active");
        applyFilters();
      });
    });

    var sortSelect = document.getElementById("sortSelect");
    if (sortSelect && productsGrid) {
      sortSelect.addEventListener("change", function () {
        var items = Array.prototype.slice.call(productsGrid.querySelectorAll(".product"));
        var mode = sortSelect.value;
        items.sort(function (a, b) {
          if (mode === "price-asc") return +a.dataset.price - +b.dataset.price;
          if (mode === "price-desc") return +b.dataset.price - +a.dataset.price;
          if (mode === "name") return a.dataset.name.localeCompare(b.dataset.name);
          return +a.dataset.order - +b.dataset.order;
        });
        items.forEach(function (i) { productsGrid.appendChild(i); });
      });
    }
  }

  /* ----- cart (localStorage) ----- */
  var CART_KEY = "stackly_cart";
  var getCart = function () {
    try {
      var v = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(v) ? v : [];
    } catch (err) { return []; }
  };
  var saveCart = function (cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (err) {}
    updateBadges();
  };
  var updateBadges = function () {
    var count = getCart().reduce(function (s, i) { return s + i.qty; }, 0);
    document.querySelectorAll(".cart-count").forEach(function (b) {
      b.textContent = count; b.classList.toggle("show", count > 0);
    });
  };
  updateBadges();

  document.querySelectorAll(".add-cart").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".product");
      if (!card) return;
      var cart = getCart();
      var id = card.dataset.id;
      var existing = cart.filter(function (i) { return i.id === id; })[0];
      if (existing) existing.qty++;
      else cart.push({
        id: id, name: card.dataset.name, price: +card.dataset.price,
        img: card.querySelector("img").getAttribute("src"), qty: 1
      });
      saveCart(cart);
      var old = btn.innerHTML;
      btn.textContent = "Added ✓";
      setTimeout(function () { btn.innerHTML = old; }, 1400);
    });
  });

  /* ----- cart page rendering ----- */
  var cartContent = document.getElementById("cartContent");
  if (cartContent) {
    var renderCart = function () {
      try {
      var cart = getCart();
      if (!cart.length) {
        cartContent.innerHTML =
          '<div class="cart-alert">' +
          '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 4h16v2H4zm0 4h16v12H4zm2 2v8h12v-8z"/></svg>' +
          "Your cart is currently empty.</div>" +
          '<div class="cart-empty"><a href="shop.html" class="btn btn-primary">Return to Shop</a></div>';
        return;
      }
      var subtotal = 0;
      var rows = cart.map(function (i) {
        var line = i.price * i.qty;
        subtotal += line;
        var img = String(i.img || "").replace(/\.jpe?g$/i, ".webp");
        return "<tr data-id='" + i.id + "'>" +
          "<td data-label='Product'><div class='cart-prod'><img src='" + img + "' alt='" + i.name + "'><span>" + i.name + "</span></div></td>" +
          "<td data-label='Price'>" + money(i.price) + "</td>" +
          "<td data-label='Quantity'><input class='qty-input' type='number' min='1' aria-label='Quantity for " + i.name + "' value='" + i.qty + "'></td>" +
          "<td data-label='Subtotal' class='cart-subtotal'>" + money(line) + "</td>" +
          "<td><button class='cart-remove' title='Remove'>&times;</button></td></tr>";
      }).join("");
      cartContent.innerHTML =
        "<table class='cart-table'><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr></thead><tbody>" + rows + "</tbody></table>" +
        "<div class='cart-bottom'><a href='shop.html' class='btn btn-outline-dark'>Continue Shopping</a>" +
        "<div class='cart-totals'><h2>Cart Totals</h2>" +
        "<div class='row'><span>Subtotal</span><span class='cart-subtotal'>" + money(subtotal) + "</span></div>" +
        "<div class='row'><span>Delivery</span><span>Free</span></div>" +
        "<div class='row total'><span>Total</span><span>" + money(subtotal) + "</span></div>" +
        "<button class='btn btn-primary' id='checkoutBtn'>Proceed to Checkout</button></div></div>";
      cartContent.querySelectorAll(".qty-input").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var id = inp.closest("tr").dataset.id;
          var c = getCart();
          c.forEach(function (i) { if (i.id === id) i.qty = Math.max(1, parseInt(inp.value, 10) || 1); });
          saveCart(c); renderCart();
        });
      });
      cartContent.querySelectorAll(".cart-remove").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.closest("tr").dataset.id;
          saveCart(getCart().filter(function (i) { return i.id !== id; }));
          renderCart();
        });
      });
      var co = document.getElementById("checkoutBtn");
      if (co) co.addEventListener("click", function () {
        alert("This is a demo storefront. Connect a payment gateway to accept live orders.");
      });
      } catch (err) {
        /* never leave the cart area blank */
        cartContent.innerHTML =
          '<div class="cart-alert">Your cart could not be loaded.</div>' +
          '<div class="cart-empty"><a href="shop.html" class="btn btn-primary">Return to Shop</a></div>';
      }
    };
    renderCart();
  }
})();
