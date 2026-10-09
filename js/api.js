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
            window.__BRAND__ = { ...cached.branding, webName: "Ryex" };
            return window.__BRAND__;
        }
    } catch {}

    try {
        const data = await api("/branding");
        window.__BRAND__ = { ...data.branding, webName: "Ryex" };
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ branding: data.branding, savedAt: Date.now() })); } catch {}
        return window.__BRAND__;
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

function applyTheme() {
    document.documentElement.dataset.theme = "default";
    localStorage.setItem("shoyu-theme", "default");
}

applyTheme();

// ---------- APP NAVIGATION ---------- //
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
    { href: "/profile.html", icon: "profile", label: "Profile", sub: "Account info" },
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
        ? `<img class="brand-photo" src="${brand.logoPhoto}" alt="Ryex logo">`
        : "";
    const menuLogoMarkup = brand.logoPhoto
        ? `<img class="menu-logo" src="${brand.logoPhoto}" alt="Open sidebar">`
        : "";
    const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));
    const navigation = visibleNavItems.map((item) => `
        <a class="sidebar-link sidebar-nav-link ${item.href === activeHref ? "active" : ""}" href="${item.href}">
            ${icon(item.icon)}
            <span class="sidebar-link-copy"><strong>${item.label}</strong><small>${item.sub}</small></span>
        </a>
    `).join("");
    const selectableNavItems = visibleNavItems.filter((item) =>
        !["/dashboard.html", "/tools.html"].includes(item.href)
    );
    const menuItems = selectableNavItems.map((item) => `
            <a class="dock-menu-item ${activeHref === item.href ? "active" : ""}" href="${item.href}" ${activeHref === item.href ? 'aria-current="page"' : ""}>
                ${icon(item.icon)}<span>${item.label}</span>
            </a>
    `).join("");
    const homeItem = visibleNavItems.find((item) => item.href === "/dashboard.html");
    const toolsItem = visibleNavItems.find((item) => item.href === "/tools.html");
    const menuIsActive = selectableNavItems.some((item) => item.href === activeHref);
    shell.innerHTML = `
        <aside class="sidebar" id="sidebar">
            <a class="sidebar-brand" href="/dashboard.html" aria-label="Open dashboard" title="Dashboard">
                ${logoMarkup}
                <span class="sidebar-brand-copy"><strong class="brand-wordmark brand-wordmark-sidebar">Ryex</strong><small>${brand.panelLabel || "Control panel"}</small></span>
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
                    <button class="menu-toggle" id="menu-toggle" aria-label="Toggle sidebar" title="Toggle sidebar">${menuLogoMarkup}</button>
                    ${!isDashboard ? `<a class="back-btn" href="/dashboard.html">${icon("back")}</a>` : ""}
                    <div class="topbar-identity"><h1 id="page-title"></h1></div>
                </div>
                <div class="topbar-actions">
                    <div class="notification-wrap">
                        <button class="notification-toggle" id="notification-toggle" type="button" aria-label="Notifications" aria-expanded="false" aria-controls="notification-panel">
                            ${icon("bell")}
                            <span class="notification-count" id="notification-count" hidden></span>
                        </button>
                        <section class="notification-panel" id="notification-panel" aria-label="Notifications" hidden>
                            <div class="notification-panel-heading">
                                <div><strong>Notifications</strong><span id="notification-summary">Loading...</span></div>
                                <button class="notification-read-all" id="notification-read-all" type="button" disabled>Mark all read</button>
                            </div>
                            <div class="notification-list" id="notification-list" aria-live="polite"></div>
                        </section>
                    </div>
                    <span class="theme-toggle" aria-label="Active theme">Default</span>
                    <span class="role-badge">${user.role}</span>
                </div>
            </div>
            <div id="page-content"></div>
        </main>
        <nav class="bottom-dock" aria-label="Navigasi utama">
            ${homeItem ? `<a class="dock-action ${activeHref === homeItem.href ? "active" : ""}" href="${homeItem.href}" aria-label="Beranda" title="Beranda" ${activeHref === homeItem.href ? 'aria-current="page"' : ""}>${icon("home")}<span>Beranda</span></a>` : ""}
            <div class="dock-menu-wrap">
                <button class="dock-action ${menuIsActive ? "active" : ""}" id="dock-menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="dock-menu-panel" ${menuIsActive ? 'aria-current="page"' : ""}>
                    ${icon("grid")}<span>Menu</span>
                </button>
                <div class="dock-menu-panel" id="dock-menu-panel" hidden>
                    ${menuItems}
                </div>
            </div>
            ${toolsItem ? `<a class="dock-action ${activeHref === toolsItem.href ? "active" : ""}" href="${toolsItem.href}" aria-label="Tools" title="Tools" ${activeHref === toolsItem.href ? 'aria-current="page"' : ""}>${icon("globe")}<span>Tools</span></a>` : ""}
            <button class="dock-action dock-theme-action" id="dock-theme-action" type="button" aria-label="Tema: Default" title="Tema Default">
                ${icon("palette")}<span>Tema</span>
            </button>
        </nav>
    `;

    const bottomDock = shell.querySelector(".bottom-dock");
    bottomDock.remove();
    document.body.prepend(shell);
    document.body.append(bottomDock);
    document.getElementById("logout-btn").addEventListener("click", logout);
    initNotificationCenter();
    document.getElementById("menu-toggle").addEventListener("click", () => {
        document.querySelector(".app-shell").classList.toggle("sidebar-collapsed");
        document.getElementById("sidebar").classList.toggle("open");
    });
    const dockMenuToggle = document.getElementById("dock-menu-toggle");
    const dockMenuPanel = document.getElementById("dock-menu-panel");
    dockMenuToggle.addEventListener("click", () => {
        const expanded = dockMenuToggle.getAttribute("aria-expanded") === "true";
        dockMenuToggle.setAttribute("aria-expanded", String(!expanded));
        dockMenuPanel.hidden = expanded;
    });
    document.getElementById("dock-theme-action").addEventListener("click", () => {
        applyTheme();
        toast("Tema Default aktif.", "info");
    });
    document.addEventListener("pointerdown", (event) => {
        if (!dockMenuPanel.contains(event.target) && !dockMenuToggle.contains(event.target)) {
            dockMenuPanel.hidden = true;
            dockMenuToggle.setAttribute("aria-expanded", "false");
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        dockMenuPanel.hidden = true;
        dockMenuToggle.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("pointerdown", (event) => {
        const sidebar = document.getElementById("sidebar");
        const toggle = document.getElementById("menu-toggle");
        if (window.innerWidth <= 860 && sidebar.classList.contains("open") && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
            sidebar.classList.remove("open");
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const sidebar = document.getElementById("sidebar");
        if (window.innerWidth <= 860) sidebar.classList.remove("open");
    });
    return document.getElementById("page-content");
}

function initNotificationCenter() {
    const toggle = document.getElementById("notification-toggle");
    const panel = document.getElementById("notification-panel");
    const list = document.getElementById("notification-list");
    const count = document.getElementById("notification-count");
    const summary = document.getElementById("notification-summary");
    const readAllButton = document.getElementById("notification-read-all");
    if (!toggle || !panel || !list || !count || !summary || !readAllButton) return;

    let unreadCount = 0;
    let notificationItems = [];
    let requestPending = false;

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const safeInternalLink = (value) => {
        if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "";
        const url = new URL(value, window.location.origin);
        return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "";
    };

    const renderNotifications = () => {
        count.hidden = unreadCount === 0;
        count.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        toggle.setAttribute("aria-label", unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications");
        summary.textContent = unreadCount ? `${unreadCount} unread` : "You're all caught up";
        readAllButton.disabled = unreadCount === 0 || requestPending;

        if (!notificationItems.length) {
            list.innerHTML = `<div class="notification-empty">No notifications yet.</div>`;
            return;
        }

        list.innerHTML = notificationItems.map((item) => {
            const unread = !item.read;
            const stamp = item.createdAt && Number.isFinite(Date.parse(item.createdAt))
                ? new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                : "";
            const link = safeInternalLink(item.link);
            return `
                <article class="notification-item ${unread ? "unread" : ""}" data-notification-id="${escapeHtml(item.id)}" ${link ? `data-notification-link="${escapeHtml(link)}"` : ""}>
                    <span class="notification-dot" aria-hidden="true"></span>
                    <div class="notification-copy">
                        <strong>${escapeHtml(item.title || "Notification")}</strong>
                        <p>${escapeHtml(item.message)}</p>
                        ${stamp ? `<time>${escapeHtml(stamp)}</time>` : ""}
                    </div>
                    ${unread ? `<button class="notification-mark-read" type="button" data-mark-notification="${escapeHtml(item.id)}" aria-label="Mark ${escapeHtml(item.title || "notification")} as read" title="Mark as read">✓</button>` : ""}
                </article>
            `;
        }).join("");
    };

    const loadNotifications = async () => {
        if (requestPending) return;
        requestPending = true;
        readAllButton.disabled = true;
        try {
            const response = await api("/dashboard/notifications");
            notificationItems = Array.isArray(response.notifications) ? response.notifications : [];
            unreadCount = notificationItems.filter((item) => !item.read).length;
            renderNotifications();
        } catch (error) {
            summary.textContent = "Couldn't load notifications";
            list.innerHTML = `<div class="notification-error">${escapeHtml(error.message)}<button type="button" class="notification-retry" id="notification-retry">Try again</button></div>`;
        } finally {
            requestPending = false;
            readAllButton.disabled = unreadCount === 0;
        }
    };

    const markRead = async (notificationId) => {
        try {
            await api(`/dashboard/notifications/${encodeURIComponent(notificationId)}/read`, { method: "POST" });
            await loadNotifications();
        } catch (error) {
            toast(`Couldn't update notification: ${error.message}`, "error");
        }
    };

    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        panel.hidden = isOpen;
        if (!isOpen) loadNotifications();
    });

    readAllButton.addEventListener("click", async () => {
        if (requestPending || unreadCount === 0) return;
        requestPending = true;
        readAllButton.disabled = true;
        try {
            await api("/dashboard/notifications/read-all", { method: "POST" });
            notificationItems = notificationItems.map((item) => ({ ...item, read: true }));
            unreadCount = 0;
            renderNotifications();
        } catch (error) {
            toast(`Couldn't update notifications: ${error.message}`, "error");
        } finally {
            requestPending = false;
            readAllButton.disabled = unreadCount === 0;
        }
    });

    list.addEventListener("click", async (event) => {
        const retryButton = event.target.closest("#notification-retry");
        if (retryButton) {
            loadNotifications();
            return;
        }
        const markButton = event.target.closest("[data-mark-notification]");
        if (markButton) {
            event.stopPropagation();
            markRead(markButton.dataset.markNotification);
            return;
        }
        const item = event.target.closest(".notification-item");
        if (!item) return;
        const link = item.dataset.notificationLink;
        if (item.classList.contains("unread")) await markRead(item.dataset.notificationId);
        if (link) window.location.assign(link);
    });

    document.addEventListener("pointerdown", (event) => {
        if (!panel.contains(event.target) && !toggle.contains(event.target)) {
            panel.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    });

    loadNotifications();
    const refreshTimer = window.setInterval(() => {
        if (!document.hidden) loadNotifications();
    }, 60_000);
    window.addEventListener("pagehide", () => window.clearInterval(refreshTimer), { once: true });
}

function setPageTitle(title) {
    const el = document.getElementById("page-title");
    if (el) el.textContent = title;
    document.title = `${title} - Ryex`;
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