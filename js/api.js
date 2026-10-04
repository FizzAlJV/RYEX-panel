// ---------- TOAST ---------- //
function ensureToastContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
        c = document.createElement("div");
        c.id = "toast-container";
        document.body.appendChild(c);
    }
    return c;
}

function toast(message, type = "info") {
    const c = ensureToastContainer();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ---------- API WRAPPER ---------- //
async function api(path, { method = "GET", body } = {}) {
    let res;
    try {
        res = await fetch(`/api${path}`, {
            method,
            headers: body ? { "Content-Type": "application/json" } : {},
            credentials: "include",
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (error) {
        const networkError = new Error("Unable to reach the server. Make sure the backend is running and only one instance is active.");
        networkError.cause = error;
        networkError.status = 0;
        throw networkError;
    }

    let data = null;
    try { data = await res.json(); } catch { /* no body */ }

    if (!res.ok) {
        const msg = data?.message || `Terjadi kesalahan (${res.status})`;
        const err = new Error(msg);
        err.errorId = data?.errorId;
        err.status = res.status;
        throw err;
    }
    return data;
}

// ---------- BRANDING ---------- //
async function loadBranding() {
    const cacheKey = "shoyu-branding-cache";
    try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (cached?.branding && Date.now() - cached.savedAt < 5 * 60 * 1000) {
            window.__BRAND__ = cached.branding;
            return cached.branding;
        }
    } catch {}

    try {
        const data = await api("/branding");
        window.__BRAND__ = data.branding;
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ branding: data.branding, savedAt: Date.now() })); } catch {}
        return data.branding;
    } catch {
        return window.__BRAND__ || null;
    }
}

// ---------- AUTH GUARD ---------- //
async function guardAuth() {
    await loadBranding();
    try {
        const data = await api("/auth/me");
        return data.user;
    } catch {
        window.location.href = "/index.html";
        return null;
    }
}

async function logout() {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/index.html";
}

const COLOR_THEME_OPTIONS = [
    { id: "pearl", label: "Pearl", swatch: "#d7d7dc" },
    { id: "default", label: "Default", swatch: "#101114" },
    { id: "midnight", label: "Midnight", swatch: "#0a0d14" },
    { id: "graphite", label: "Graphite", swatch: "#17191d" },
    { id: "frost", label: "Frost", swatch: "#dfe7ef" },
    { id: "ocean", label: "Ocean", swatch: "#0b1c2a" },
    { id: "ember", label: "Ember", swatch: "#241514" },
    { id: "ruby", label: "Ruby Graphite", swatch: "#3a121c" },
    { id: "violet", label: "Violet", swatch: "#21152f" },
    { id: "forest", label: "Forest", swatch: "#10251d" },
    { id: "amber", label: "Amber", swatch: "#30210d" },
    { id: "daylight", label: "Daylight", swatch: "#f3f5f7" },
    { id: "aurora", label: "Aurora", swatch: "#0e2a32" },
    { id: "sunset", label: "Sunset", swatch: "#39212d" },
    { id: "slate", label: "Slate", swatch: "#1d2736" },
    { id: "red-velvet", label: "Red Velvet", swatch: "#2b0d18" },
    { id: "crimson-glow", label: "Crimson Glow", swatch: "#2a050d" },
    { id: "obsidian-luxe", label: "Obsidian Luxe", swatch: "#15171d" },
    { id: "scarlet-noir", label: "Scarlet Noir", swatch: "#101014" },
    { id: "cyber-lime", label: "Cyber Lime", swatch: "#0d1b15" },
    { id: "neon-violet", label: "Neon Violet", swatch: "#191027" },
    { id: "deep-emerald", label: "Deep Emerald", swatch: "#0b2119" },
    { id: "arctic-glass", label: "Arctic Glass", swatch: "#102431" },
    { id: "copper-noir", label: "Copper Noir", swatch: "#241410" },
    { id: "dark-blue-neon", label: "Dark Blue Neon", swatch: "#071a32" },
];

const XTHEME_OPTIONS = [
    { id: "matrix", label: "Matrix", swatch: "#071910" },
    { id: "xtheme", label: "XTheme", swatch: "#071d26" },
    { id: "anime-soft", label: "Anime Soft", swatch: "#dfeeff" },
    { id: "discord-iphone", label: "Discord iPhone", swatch: "#8397d7" },
];

const THEME_OPTIONS = [...COLOR_THEME_OPTIONS, ...XTHEME_OPTIONS];

function applyTheme(themeId) {
    const theme = THEME_OPTIONS.some((item) => item.id === themeId) ? themeId : "pearl";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("shoyu-theme", theme);

    document.querySelectorAll(".theme-option[data-theme]").forEach((option) => {
        option.classList.toggle("is-selected", option.dataset.theme === theme);
    });
}

const themeMigrationKey = "ryex-default-workspace-v5";
if (localStorage.getItem(themeMigrationKey) !== "1") {
    applyTheme("default");
    localStorage.setItem(themeMigrationKey, "1");
} else {
    applyTheme(localStorage.getItem("shoyu-theme") || "default");
}

// ---------- NAV (dipakai kotak-kotak di Dashboard, bukan sidebar) ---------- //
const NAV_ITEMS = [
    { href: "/dashboard.html", icon: "dashboard", label: "Dashboard", sub: "Overview" },
    { href: "/whatsapp.html", icon: "whatsapp", label: "WhatsApp", sub: "Manage senders", roles: ["OWNER", "ADMIN", "RESELLER", "VVIP", "PREMIUM"] },
    { href: "/xmessage.html", icon: "bug", label: "Travas", sub: "Send messages", roles: ["OWNER", "ADMIN", "RESELLER", "VVIP", "PREMIUM"] },
    { href: "/chat.html", icon: "whatsapp", label: "Live Chat", sub: "Talk to panel users", roles: ["OWNER", "ADMIN", "RESELLER", "VVIP", "PREMIUM"] },
    { href: "/sessions.html", icon: "sessions", label: "Sessions", sub: "Connection status", roles: ["OWNER", "ADMIN", "RESELLER", "VVIP", "PREMIUM"] },
    { href: "/logs.html", icon: "logs", label: "Logs", sub: "Activity & errors", roles: ["OWNER", "ADMIN", "RESELLER"] },
    { href: "/system.html", icon: "system", label: "System Status", sub: "System health", roles: ["OWNER", "ADMIN", "RESELLER", "VVIP", "PREMIUM"] },
    { href: "/tools.html", icon: "system", label: "Tools", sub: "Useful utilities" },
    { href: "/database.html", icon: "database", label: "Database", sub: "Manage users", roles: ["OWNER", "ADMIN", "RESELLER"] },
    { href: "/profile.html", icon: "profile", label: "Profile", sub: "Telegram profile" },
];

function isInternalPageLink(anchor, event) {
    if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin && url.pathname.endsWith(".html");
}

document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!isInternalPageLink(anchor, event)) return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

    event.preventDefault();
    window.location.href = destination.href;
});

window.addEventListener("pageshow", () => {
    document.body.classList.remove("page-exiting");
    document.body.classList.add("page-entered");
});

// ---------- SHELL (sidebar minimal + topbar) ---------- //
function renderShell(user, activeHref) {
    const brand = window.__BRAND__ || {};
    const isDashboard = activeHref === "/dashboard.html";

    const shell = document.createElement("div");
    const pageName = activeHref.replace("/", "").replace(".html", "") || "dashboard";
    shell.className = `app-shell page-${pageName}`;

    const channelLink = brand.telegramChannel
        ? `<a class="sidebar-link" href="${brand.telegramChannel}" target="_blank" rel="noopener">${icon("channel")}<span>Channel</span></a>`
        : "";
    const ownerLink = brand.telegramOwnerContact
        ? `<a class="sidebar-link" href="${brand.telegramOwnerContact}" target="_blank" rel="noopener">${icon("owner")}<span>Owner</span></a>`
        : "";
    const logoMarkup = brand.logoPhoto
        ? `<img class="brand-photo" src="${brand.logoPhoto}" alt="${brand.webName || "RYEX - PANEL"} logo">`
        : "";
    const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));
    const navigation = visibleNavItems.map((item) => `
        <a class="sidebar-link sidebar-nav-link ${item.href === activeHref ? "active" : ""}" href="${item.href}">
            ${icon(item.icon)}
            <span class="sidebar-link-copy"><strong>${item.label}</strong><small>${item.sub}</small></span>
        </a>
    `).join("");
    const colorThemeOptions = COLOR_THEME_OPTIONS.map((theme, index) => {
        const isSelected = document.documentElement.dataset.theme === theme.id;
        return `
            <button type="button" class="theme-option ${isSelected ? "is-selected" : ""} ${index >= 9 ? "theme-option-extra" : ""}" data-theme="${theme.id}">
                <i style="--swatch:${theme.swatch}"></i>
                <span>${theme.label}</span>
            </button>
        `;
    }).join("");
    const xThemeOptions = XTHEME_OPTIONS.map((theme) => {
        const isSelected = document.documentElement.dataset.theme === theme.id;
        return `
            <button type="button" class="theme-option ${isSelected ? "is-selected" : ""}" data-theme="${theme.id}">
                <i style="--swatch:${theme.swatch}"></i>
                <span>${theme.label}</span>
            </button>
        `;
    }).join("");

    shell.innerHTML = `
        <button class="sidebar-backdrop" id="sidebar-backdrop" type="button" aria-label="Close navigation" hidden></button>
        <aside class="sidebar" id="sidebar" aria-hidden="true" inert>
            <a class="sidebar-brand" href="/dashboard.html" aria-label="Open dashboard" title="Dashboard">
                ${logoMarkup}
                <span class="sidebar-brand-copy"><strong class="brand-wordmark brand-wordmark-sidebar">${brand.webName || "RYEX - PANEL"}</strong><small>${brand.panelLabel || "Control panel"}</small></span>
            </a>
            <div class="sidebar-section-label">Workspace</div>
            <nav class="sidebar-navigation" aria-label="Primary navigation">
                ${navigation}
            </nav>
            <div class="sidebar-spacer"></div>
            <div class="sidebar-section-label sidebar-support-label">Support</div>
            <div class="sidebar-links">
                ${channelLink}
                ${ownerLink}
            </div>
            <div class="sidebar-user">Signed in as <strong>${user.username}</strong></div>
            <button class="logout-btn" id="logout-btn">${icon("logout")}<span>Logout</span></button>
        </aside>
        <main class="main">
            <div class="topbar">
                <div class="topbar-left">
                    <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false" title="Open navigation">${icon("menu")}</button>
                    ${!isDashboard ? `<a class="back-btn" href="/dashboard.html">${icon("back")}</a>` : ""}
                    <div class="topbar-identity"><h1 id="page-title"></h1></div>
                </div>
                        <div class="topbar-actions">
                            <div class="theme-menu-wrap">
                                <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Choose theme" aria-haspopup="true" aria-expanded="false">${icon("system")}<span>Theme</span></button>
                                <div class="theme-menu" id="theme-menu" hidden>
                                    <div class="theme-group"><div class="theme-group-label">Color</div>${colorThemeOptions}</div>
                                    <div class="theme-group"><div class="theme-group-label">XTheme</div>${xThemeOptions}</div>
                                    <button type="button" class="theme-more" id="theme-more">More themes</button>
                                </div>
                            </div>
                        </div>
            </div>
            <div id="page-content"></div>
        </main>
    `;

    document.body.prepend(shell);
    document.getElementById("logout-btn").addEventListener("click", logout);
    const sidebar = document.getElementById("sidebar");
    const main = shell.querySelector(".main");
    const sidebarToggle = document.getElementById("menu-toggle");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");
    const closeSidebar = (restoreFocus = false) => {
        sidebar.classList.remove("open");
        sidebar.setAttribute("aria-hidden", "true");
        sidebar.inert = true;
        main.inert = false;
        document.body.classList.remove("sidebar-open");
        sidebarBackdrop.hidden = true;
        sidebarToggle.setAttribute("aria-expanded", "false");
        sidebarToggle.setAttribute("aria-label", "Open navigation");
        sidebarToggle.title = "Open navigation";
        if (restoreFocus) sidebarToggle.focus();
    };
    const openSidebar = () => {
        sidebar.classList.add("open");
        sidebar.removeAttribute("aria-hidden");
        sidebar.inert = false;
        main.inert = true;
        document.body.classList.add("sidebar-open");
        sidebarBackdrop.hidden = false;
        sidebarToggle.setAttribute("aria-expanded", "true");
        sidebarToggle.setAttribute("aria-label", "Close navigation");
        sidebarToggle.title = "Close navigation";
        sidebar.querySelector("a")?.focus();
    };
    sidebarToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) closeSidebar(true);
        else openSidebar();
    });
    sidebarBackdrop.addEventListener("click", () => closeSidebar(true));
    sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeSidebar()));
    document.addEventListener("pointerdown", (event) => {
        if (sidebar.classList.contains("open") && !sidebar.contains(event.target) && !sidebarToggle.contains(event.target) && !sidebarBackdrop.contains(event.target)) {
            closeSidebar();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && sidebar.classList.contains("open")) closeSidebar(true);
    });
    const themeToggle = document.getElementById("theme-toggle");
    const themeMenu = document.getElementById("theme-menu");
    const themeMore = document.getElementById("theme-more");
    const themeMenuWrap = themeToggle.closest(".theme-menu-wrap");
    const closeThemeMenu = () => {
        themeMenu.hidden = true;
        themeToggle.setAttribute("aria-expanded", "false");
    };
    themeToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        themeMenu.hidden = !themeMenu.hidden;
        themeToggle.setAttribute("aria-expanded", String(!themeMenu.hidden));
    });
    themeMore.addEventListener("click", (event) => {
        event.stopPropagation();
        const expanded = themeMenu.classList.toggle("is-expanded");
        themeMore.textContent = expanded ? "Show fewer" : "More themes";
    });
    themeMenu.querySelectorAll("[data-theme]").forEach((option) => {
        option.addEventListener("click", () => {
            applyTheme(option.dataset.theme);
            closeThemeMenu();
        });
    });
    document.addEventListener("pointerdown", (event) => {
        if (themeMenu.hidden || themeMenuWrap.contains(event.target)) return;
        closeThemeMenu();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || themeMenu.hidden) return;
        closeThemeMenu();
        themeToggle.focus();
    });
    themeMenu.addEventListener("click", (event) => event.stopPropagation());

    return document.getElementById("page-content");
}

function setPageTitle(title) {
    const el = document.getElementById("page-title");
    if (el) el.textContent = title;
    const brand = window.__BRAND__ || {};
    document.title = `${title} - ${brand.webName || "Panel"}`;
}

function skeletonGrid(count = 4) {
    return `<div class="grid grid-4">${Array.from({ length: count })
        .map(() => `<div class="card"><div class="skeleton" style="height:52px"></div></div>`)
        .join("")}</div>`;
}

function emptyState(text, iconName = "logs") {
    return `<div class="empty-state">${icon(iconName)}<div>${text}</div></div>`;
}

function errorState(text, iconName = "system") {
    return `<div class="error-state">${icon(iconName)}<div>${text}</div></div>`;
}

function pillClass(status) {
    return (status || "disconnected").toLowerCase();
}