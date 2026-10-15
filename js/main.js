/* ============================================================
   STACKLY — main.js (food truck website)
   ============================================================ */
(function () {
  "use strict";

  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };

  /* ============================================================
     Security helpers (fixes ITS-002 password storage and
     ITS-003 session tampering)
       · dependency-free SHA-256 + HMAC-SHA256 (synchronous)
       · salted one-way password hashing — never store plaintext
       · tamper-evident, expiring session records
     NOTE: this is a static demo build; a production site must
     additionally enforce credentials on a trusted server.
     ============================================================ */
  var SHA_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  var utf8Bytes = function (str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    var out = [], i;
    for (i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var lo = str.charCodeAt(i + 1);
        if (lo >= 0xdc00 && lo <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(out);
  };

  var rotr32 = function (x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; };

  var sha256Bytes = function (bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length;
    var total = (((l + 9 + 63) >> 6) << 6);
    var buf = new Uint8Array(total);
    buf.set(bytes);
    buf[l] = 0x80;
    var bitLo = (l * 8) >>> 0;
    var bitHi = Math.floor((l * 8) / 4294967296);
    buf[total - 8] = (bitHi >>> 24) & 255; buf[total - 7] = (bitHi >>> 16) & 255;
    buf[total - 6] = (bitHi >>> 8) & 255;  buf[total - 5] = bitHi & 255;
    buf[total - 4] = (bitLo >>> 24) & 255; buf[total - 3] = (bitLo >>> 16) & 255;
    buf[total - 2] = (bitLo >>> 8) & 255;  buf[total - 1] = bitLo & 255;

    var w = new Array(64);
    var off, i;
    for (off = 0; off < total; off += 64) {
      for (i = 0; i < 16; i++) {
        var j = off + i * 4;
        w[i] = ((buf[j] << 24) | (buf[j + 1] << 16) | (buf[j + 2] << 8) | buf[j + 3]) >>> 0;
      }
      for (i = 16; i < 64; i++) {
        var s0 = (rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
        var s1 = (rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
        var ch = ((e & f) ^ (~e & g)) >>> 0;
        var t1 = (h + S1 + ch + SHA_K[i] + w[i]) >>> 0;
        var S0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
        var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H;
  };

  var toHex = function (words) {
    var hex = "", i;
    for (i = 0; i < words.length; i++) hex += ("00000000" + words[i].toString(16)).slice(-8);
    return hex;
  };

  var sha256hex = function (str) { return toHex(sha256Bytes(utf8Bytes(str))); };

  var hmacHex = function (keyStr, msgStr) {
    var key = utf8Bytes(keyStr);
    if (key.length > 64) {
      var kw = sha256Bytes(key), kb = new Uint8Array(32), ki;
      for (ki = 0; ki < 32; ki++) kb[ki] = (kw[ki >>> 2] >>> (24 - (ki % 4) * 8)) & 255;
      key = kb;
    }
    var ipad = new Uint8Array(64), opad = new Uint8Array(64), i;
    for (i = 0; i < 64; i++) {
      var b = i < key.length ? key[i] : 0;
      ipad[i] = b ^ 0x36; opad[i] = b ^ 0x5c;
    }
    var msg = utf8Bytes(msgStr);
    var stage1 = new Uint8Array(64 + msg.length);
    stage1.set(ipad); stage1.set(msg, 64);
    var ih = sha256Bytes(stage1);
    var innerBytes = new Uint8Array(32);
    for (i = 0; i < 32; i++) innerBytes[i] = (ih[i >>> 2] >>> (24 - (i % 4) * 8)) & 255;
    var stage2 = new Uint8Array(64 + 32);
    stage2.set(opad); stage2.set(innerBytes, 64);
    return toHex(sha256Bytes(stage2));
  };

  /* Known-answer self-test — if the hash implementation is ever wrong,
     auth fails closed instead of storing/comparing garbage. */
  var SEC_OK =
    sha256hex("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" &&
    sha256hex("abc") === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

  var SESSION_KEY = "stackly_session";
  var SESSION_SECRET = "stackly.demo.session.signing.v1"; /* demo build only */
  var SESSION_TTL = 7 * 24 * 60 * 60 * 1000;             /* 7 days */

  var signSession = function (s) {
    return hmacHex(SESSION_SECRET, JSON.stringify([s.name, s.email, s.role, s.iat, s.exp]));
  };

  window.StacklySec = {
    ok: SEC_OK,
    sha256hex: sha256hex,
    hmacHex: hmacHex,
    hashPw: function (pw, salt) { return sha256hex(String(salt) + ":" + pw); },
    randHex: function (n) {
      var a = new Uint8Array(n || 16), i;
      if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
      else for (i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
      var hex = "";
      for (i = 0; i < a.length; i++) hex += ("0" + a[i].toString(16)).slice(-2);
      return hex;
    },
    /* build + sign + store a session */
    set: function (s) {
      if (!SEC_OK) return null;
      var rec = { name: s.name, email: s.email, role: s.role, iat: Date.now(), exp: Date.now() + SESSION_TTL };
      rec.sig = signSession(rec);
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(rec)); } catch (err) {}
      return rec;
    },
    /* read + verify signature / expiry / role — destroy anything that fails */
    get: function () {
      if (!SEC_OK) return null;
      try {
        var s = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (!s || typeof s !== "object") return null;
        var bad = !s.sig || typeof s.iat !== "number" || typeof s.exp !== "number" ||
          Date.now() > s.exp || (s.role !== "user" && s.role !== "admin") ||
          signSession(s) !== s.sig;
        if (bad) { try { localStorage.removeItem(SESSION_KEY); } catch (err) {} return null; }
        return s;
      } catch (err) { return null; }
    },
    kill: function () { try { localStorage.removeItem(SESSION_KEY); } catch (err) {} }
  };

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

  /* ---------- Login state in header (signature-verified — ITS-003) ---------- */
  var getSession = function () {
    try { return window.StacklySec ? window.StacklySec.get() : null; } catch (err) { return null; }
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

  /* ---------- Contact form (ITS-005: never accept an empty required field) ---------- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = contactForm.querySelector(".form-msg");
      var bad = null;
      contactForm.querySelectorAll("[required]").forEach(function (f) {
        if (!bad && !String(f.value || "").trim()) bad = f;
      });
      if (bad) {
        if (msg) {
          msg.textContent = (bad.getAttribute("placeholder") || "This field") + " is required — please fill it in before sending.";
          msg.style.color = "var(--red)";
          msg.classList.add("show");
          setTimeout(function () { msg.classList.remove("show"); }, 6000);
        }
        try { bad.focus(); } catch (err) {}
        return;
      }
      if (msg) {
        msg.style.color = "";
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
