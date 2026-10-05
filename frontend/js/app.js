const API = "";
let token = localStorage.getItem("authguard_token") || null;
let currentUser = null;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message show ${type}`;
}

function setAuthUI(loggedIn) {
  $("#auth-panel").classList.toggle("hidden", loggedIn);
  $("#dashboard").classList.toggle("hidden", !loggedIn);
  $("#user-bar").classList.toggle("hidden", !loggedIn);
  if (loggedIn && currentUser) {
    $("#user-info").textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
    const isAdmin = currentUser.role === "admin";
    const isMA = isAdmin || currentUser.role === "manager";
    $$(".admin-only").forEach((el) => el.classList.toggle("hidden", !isAdmin));
    $$(".admin-manager-only").forEach((el) => el.classList.toggle("hidden", !isMA));
  }
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

$$(".nav-links a, .hero-actions a[href^='#'], #nav-demo-btn").forEach((el) => {
  el.addEventListener("click", (e) => {
    const href = el.getAttribute("href") || "#demo";
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = $(href);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

$$(".fill-creds").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".demo-acc");
    $("#login-username").value = card.dataset.user;
    $("#login-password").value = card.dataset.pass;
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$('.tab[data-tab="login"]').forEach((t) => t.classList.add("active"));
    $("#login-form").classList.remove("hidden");
    $("#register-form").classList.add("hidden");
    $("#login-username").focus();
  });
});

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    $("#login-form").classList.toggle("hidden", !isLogin);
    $("#register-form").classList.toggle("hidden", isLogin);
    $("#auth-message").className = "message";
  });
});

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#auth-message");
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("#login-username").value.trim(),
        password: $("#login-password").value
      })
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("authguard_token", token);
    showMessage(msg, `Welcome, ${data.user.username}! Risk level: ${data.risk?.level || "n/a"}`, "success");
    setAuthUI(true);
    loadProfile();
  } catch (err) {
    const extra = err.data?.remainingAttempts != null ? ` (${err.data.remainingAttempts} attempts left)` : "";
    const lock = err.data?.remainingMinutes != null ? ` Locked for ~${err.data.remainingMinutes} min.` : "";
    showMessage(msg, err.message + extra + lock, "error");
  }
});

$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#auth-message");
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: $("#reg-username").value.trim(),
        email: $("#reg-email").value.trim(),
        password: $("#reg-password").value,
        role: $("#reg-role").value
      })
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("authguard_token", token);
    showMessage(msg, "Account created successfully!", "success");
    setAuthUI(true);
    loadProfile();
  } catch (err) {
    showMessage(msg, err.message + (err.data?.details ? ": " + err.data.details.join(", ") : ""), "error");
  }
});

$("#btn-logout").addEventListener("click", () => {
  token = null;
  currentUser = null;
  localStorage.removeItem("authguard_token");
  setAuthUI(false);
  $("#auth-message").className = "message";
  ["profile-data","risk-data","resource-data","stats-data","audit-data"].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = "—"; });
});

async function loadProfile() {
  try {
    $("#profile-data").textContent = JSON.stringify(await api("/api/profile"), null, 2);
  } catch (err) {
    $("#profile-data").textContent = err.message;
  }
}

$("#btn-risk").addEventListener("click", async () => {
  try {
    const data = await api("/api/risk", {
      headers: {
        "x-device-trust": $("#risk-device").value,
        "x-location": $("#risk-location").value,
        "x-sensitive-action": $("#risk-sensitive").checked ? "true" : "false"
      }
    });
    $("#risk-data").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    $("#risk-data").textContent = err.message;
  }
});

$$("[data-resource]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      $("#resource-data").textContent = JSON.stringify(await api(btn.dataset.resource), null, 2);
    } catch (err) {
      $("#resource-data").textContent = `${err.status}: ${err.message}`;
    }
  });
});

$("#btn-stats")?.addEventListener("click", async () => {
  try {
    $("#stats-data").textContent = JSON.stringify(await api("/api/admin/stats"), null, 2);
  } catch (err) {
    $("#stats-data").textContent = err.message;
  }
});

$("#btn-audit")?.addEventListener("click", async () => {
  try {
    $("#audit-data").textContent = JSON.stringify(await api("/api/audit?limit=30"), null, 2);
  } catch (err) {
    $("#audit-data").textContent = err.message;
  }
});

(async () => {
  if (token) {
    try {
      currentUser = await api("/api/profile");
      setAuthUI(true);
      loadProfile();
    } catch {
      token = null;
      localStorage.removeItem("authguard_token");
      setAuthUI(false);
    }
  } else {
    setAuthUI(false);
  }
})();
