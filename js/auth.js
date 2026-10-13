/* ============================================================
   STACKLY — auth.js (role-based login / signup / dashboards)
   Roles: user, admin   ·   storage: localStorage
   ============================================================ */
(function () {
  "use strict";

  var USERS_KEY = "stackly_users";
  var SESSION_KEY = "stackly_session";

  var getUsers = function () {
    try {
      var v = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(v) ? v : [];
    } catch (err) { return []; }
  };
  var saveUsers = function (list) { try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (err) {} };
  var getSession = function () {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (err) { return null; }
  };
  var setSession = function (s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (err) {} };
  var killSession = function () { try { localStorage.removeItem(SESSION_KEY); } catch (err) {} };

  /* Seed a demo admin account on first run (never let storage errors kill the page) */
  (function seed() {
    try {
      var users = getUsers();
      var hasAdmin = users.some(function (u) { return u.role === "admin"; });
      if (!hasAdmin) {
        users.push({ name: "Stackly Admin", email: "admin@stackly.com", password: "admin123", role: "admin" });
        saveUsers(users);
      }
    } catch (err) {}
  })();

  /* ---------- shared: role pill toggles ---------- */
  var activeRole = "user";
  document.querySelectorAll(".role-pills").forEach(function (group) {
    var pills = group.querySelectorAll(".role-pill");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        activeRole = pill.dataset.role;
      });
    });
    group.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var idx = Array.prototype.indexOf.call(pills, document.activeElement);
        if (idx > -1) {
          e.preventDefault();
          var next = e.key === "ArrowRight" ? (idx + 1) % pills.length : (idx - 1 + pills.length) % pills.length;
          pills[next].focus(); pills[next].click();
        }
      }
    });
  });

  var showErr = function (form, text) {
    var box = form.querySelector(".auth-err");
    if (box) { box.textContent = text; box.classList.add("show"); }
  };

  /* ---------- Login form ---------- */
  var loginForm = document.getElementById("loginForm");
  if (loginForm) {
    /* already logged in? bounce to dashboard */
    var existing = getSession();
    if (existing) {
      location.href = existing.role === "admin" ? "admin.html" : "dashboard.html";
      return;
    }
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = loginForm.querySelector("[name=email]").value.trim().toLowerCase();
      var pass = loginForm.querySelector("[name=password]").value;
      var user = getUsers().filter(function (u) { return u.email === email && u.password === pass; })[0];
      if (!user) { showErr(loginForm, "Invalid email or password. Please try again."); return; }
      if (user.role !== activeRole) {
        showErr(loginForm, "This account is registered as \"" + user.role + "\" — select the correct role to continue.");
        return;
      }
      setSession({ name: user.name, email: user.email, role: user.role });
      location.href = user.role === "admin" ? "admin.html" : "dashboard.html";
    });
  }

  /* ---------- Signup form ---------- */
  var signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = signupForm.querySelector("[name=name]").value.trim();
      var email = signupForm.querySelector("[name=email]").value.trim().toLowerCase();
      var pass = signupForm.querySelector("[name=password]").value;
      var pass2 = signupForm.querySelector("[name=confirm]").value;
      if (name.length < 2) { showErr(signupForm, "Please enter your full name."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr(signupForm, "Please enter a valid email address."); return; }
      if (pass.length < 6) { showErr(signupForm, "Password must be at least 6 characters."); return; }
      if (pass !== pass2) { showErr(signupForm, "Passwords do not match."); return; }
      var users = getUsers();
      if (users.some(function (u) { return u.email === email; })) {
        showErr(signupForm, "An account with this email already exists. Please log in.");
        return;
      }
      users.push({ name: name, email: email, password: pass, role: activeRole });
      saveUsers(users);
      setSession({ name: name, email: email, role: activeRole });
      location.href = activeRole === "admin" ? "admin.html" : "dashboard.html";
    });
  }

  /* ---------- Forgot password ---------- */
  var forgotToggle = document.getElementById("forgotToggle");
  var forgotForm = document.getElementById("forgotForm");
  if (forgotToggle && forgotForm) {
    forgotToggle.addEventListener("click", function (e) {
      /* never navigate — just expand the reset form on the login page */
      e.preventDefault();
      var open = forgotForm.classList.toggle("open");
      forgotToggle.textContent = open ? "Hide reset form" : "Forgot your password?";
      if (open) forgotForm.querySelector("input").focus();
    });
    forgotForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = forgotForm.querySelector("[name=forgot-email]").value.trim().toLowerCase();
      var msg = forgotForm.querySelector(".forgot-msg");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Please enter a valid email address.";
        msg.style.color = "var(--red)";
        msg.classList.add("show");
        return;
      }
      msg.textContent = "Reminder sent! A password reset link is on its way to " + email + ".";
      msg.style.color = "#2e7d32";
      msg.classList.add("show");
      forgotForm.querySelector("input").value = "";
    });
  }

  /* ---------- Social login → each provider's own login page ---------- */
  var SOCIAL_URLS = {
    Google: "https://accounts.google.com/ServiceLogin",
    Facebook: "https://www.facebook.com/login/",
    X: "https://x.com/i/flow/login"
  };
  document.querySelectorAll(".social-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var provider = btn.dataset.provider || "Google";
      var target = SOCIAL_URLS[provider];
      if (target) window.location.href = target;
    });
  });

  /* ---------- Dashboard guards + fills ---------- */
  var dash = document.querySelector("[data-guard]");
  if (dash) {
    var need = dash.getAttribute("data-guard"); /* "user" or "admin" */
    var s = getSession();
    if (!s) { location.href = "login.html"; return; }
    if (need === "admin" && s.role !== "admin") { location.href = "dashboard.html"; return; }
    if (need === "user" && s.role === "admin") { location.href = "admin.html"; return; }

    document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = s.name; });
    document.querySelectorAll("[data-user-email]").forEach(function (el) { el.textContent = s.email; });
    document.querySelectorAll("[data-user-role]").forEach(function (el) { el.textContent = s.role === "admin" ? "Administrator" : "Customer"; });

    document.querySelectorAll("[data-logout]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        killSession();
        location.href = "index.html";
      });
    });

    /* ---------- Dashboard sidebar views ---------- */
    var menuBtns = document.querySelectorAll(".dash-menu button[data-dash]");
    if (menuBtns.length) {
      menuBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          menuBtns.forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active");
          document.querySelectorAll(".dash-view").forEach(function (v) {
            v.classList.toggle("active", v.getAttribute("data-dash-view") === b.dataset.dash);
          });
          var main = document.querySelector(".dash-main");
          if (main) main.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    /* ---------- Settings / address / password forms ---------- */
    document.querySelectorAll("[data-fill=name]").forEach(function (i) { i.value = s.name; });
    document.querySelectorAll("[data-fill=email]").forEach(function (i) { i.value = s.email; });

    var settingsForm = document.getElementById("settingsForm");
    if (settingsForm) {
      settingsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = settingsForm.querySelector("[name=name]").value.trim();
        var email = settingsForm.querySelector("[name=email]").value.trim().toLowerCase();
        if (name.length < 2) { showErr(settingsForm, "Please enter your full name."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr(settingsForm, "Please enter a valid email address."); return; }
        var users = getUsers();
        users.forEach(function (u) {
          if (u.email === s.email) { u.name = name; u.email = email; }
        });
        saveUsers(users);
        s.name = name; s.email = email;
        setSession(s);
        document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = s.name; });
        document.querySelectorAll("[data-user-email]").forEach(function (el) { el.textContent = s.email; });
        showErr(settingsForm, "Profile updated successfully ✓");
        settingsForm.querySelector(".auth-err").style.color = "#2e7d32";
      });
    }

    var passwordForm = document.getElementById("passwordForm");
    if (passwordForm) {
      passwordForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var cur = passwordForm.querySelector("[name=current]").value;
        var next = passwordForm.querySelector("[name=next]").value;
        var me = getUsers().filter(function (u) { return u.email === s.email; })[0];
        if (me && me.password !== cur) { showErr(passwordForm, "Current password is incorrect."); passwordForm.querySelector(".auth-err").style.color = "var(--red)"; return; }
        if (next.length < 6) { showErr(passwordForm, "New password must be at least 6 characters."); passwordForm.querySelector(".auth-err").style.color = "var(--red)"; return; }
        getUsers().forEach(function (u) { if (u.email === s.email) u.password = next; });
        saveUsers(getUsers());
        showErr(passwordForm, "Password updated successfully ✓");
        passwordForm.querySelector(".auth-err").style.color = "#2e7d32";
        passwordForm.reset();
      });
    }

    var addrForm = document.getElementById("addrForm");
    if (addrForm) {
      addrForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var label = addrForm.querySelector("[name=label]").value.trim();
        var addr = addrForm.querySelector("[name=address]").value.trim();
        if (!label || !addr) { showErr(addrForm, "Please fill in both fields."); addrForm.querySelector(".auth-err").style.color = "var(--red)"; return; }
        var list = addrForm.closest(".dash-panel").previousElementSibling;
        if (list && list.classList.contains("dash-panel")) {
          var card = document.createElement("div");
          card.className = "addr-card";
          var b = document.createElement("b");
          b.textContent = label;
          var p = document.createElement("p");
          p.textContent = addr;
          var span = document.createElement("span");
          span.className = "status pending";
          span.textContent = "New";
          card.appendChild(b); card.appendChild(p); card.appendChild(span);
          list.appendChild(card);
        }
        showErr(addrForm, "Address saved ✓");
        addrForm.querySelector(".auth-err").style.color = "#2e7d32";
        addrForm.reset();
      });
    }

    /* ---------- Admin: render registered users ---------- */
    var userList = document.getElementById("adminUserList");
    if (userList && s.role === "admin") {
      var all = getUsers();
      var count = document.getElementById("adminUserCount");
      if (count) count.textContent = String(all.length);
      if (all.length) {
        userList.innerHTML = "";
        all.forEach(function (u) {
          var li = document.createElement("li");
          var left = document.createElement("span");
          left.textContent = u.name;
          var right = document.createElement("b");
          right.className = u.role === "admin" ? "status admin" : "status";
          right.textContent = u.role === "admin" ? "Admin" : "Customer";
          li.appendChild(left);
          li.appendChild(right);
          userList.appendChild(li);
        });
      }
    }
  }

  /* ---------- Logout links outside guards (header) ---------- */
  document.querySelectorAll("[data-logout]").forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      killSession();
      location.href = "index.html";
    });
  });
})();
