(async function () {
    const user = await guardAuth();
    if (!user) return;

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const content = renderShell(user, "/dashboard.html");
    setPageTitle("Dashboard");
    content.innerHTML = `
        <div class="skeleton" style="height:170px;margin-bottom:22px"></div>
        ${skeletonGrid(3)}
    `;

    try {
        const data = await api("/dashboard");

        const dashboardNavItems = NAV_ITEMS.filter((item) => item.href !== "/dashboard.html" && (!item.roles || item.roles.includes(user.role)));
        const navBoxesHtml = dashboardNavItems.map((item, index) => `
            <a class="nav-box ${index >= 4 ? "nav-box-extra" : ""}" href="${item.href}">
                <span class="icon">${icon(item.icon)}</span>
                <span>
                    <div class="label">${item.label}</div>
                    <div class="sub">${item.sub}</div>
                </span>
                <span class="chevron">${icon("chevron")}</span>
            </a>
        `).join("");
        const navToggleHtml = dashboardNavItems.length > 4 ? `<button class="dashboard-nav-toggle" id="dashboard-nav-toggle" type="button" aria-expanded="false">Show more</button>` : "";

        const s = data.systemStatus;
        const stats = data.stats || {};
        const notifications = Array.isArray(data.notifications) ? data.notifications : [];
        const notificationMarkup = (items) => items.map((n) => {
            const notificationType = ["info", "success", "warning", "error"].includes(n.type) ? n.type : "info";
            return `
                <div class="notification-item ${n.read ? "is-read" : "is-unread"} ${notificationType}">
                    <span class="notification-bullet" aria-hidden="true"></span>
                    <div class="notification-body">
                        <strong>${escapeHtml(n.title || "Notification")}</strong>
                        <small>${escapeHtml(n.message || "")}</small>
                        <time>${new Date(n.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time>
                    </div>
                </div>
            `;
        }).join("");
        const statusItem = (name, ok) => `
            <div class="status-item ryex-status-item">
                <div class="status-row">
                    <span class="status-dot ${ok ? "online" : "offline"}"></span>
                    <span class="status-name">${escapeHtml(name)}</span>
                </div>
                <div class="status-text">${ok ? "Operational" : "Down"}</div>
            </div>
        `;
        content.innerHTML = `
            <div class="ryex-dashboard">
                <div class="ryex-butterfly-scene" aria-hidden="true">
                    <svg class="ryex-butterfly butterfly-one" viewBox="0 0 100 76">
                        <path class="butterfly-wing wing-left" d="M49 37C37 12 7 2 8 23c1 14 18 20 39 17ZM49 40C35 34 17 39 20 53c3 12 18 11 29-10Z"/>
                        <path class="butterfly-wing wing-right" d="M51 38C61 14 89 5 91 23c1 13-17 20-40 17ZM51 41c14-8 32-4 29 9-3 12-18 12-29-9Z"/>
                        <path class="butterfly-body" d="M50 31c-3 10-3 18 0 27m0-25c-4-8-8-10-12-10m12 10c4-8 8-10 12-10"/>
                    </svg>
                    <svg class="ryex-butterfly butterfly-two" viewBox="0 0 100 76">
                        <path class="butterfly-wing wing-left" d="M49 37C37 12 7 2 8 23c1 14 18 20 39 17ZM49 40C35 34 17 39 20 53c3 12 18 11 29-10Z"/>
                        <path class="butterfly-wing wing-right" d="M51 38C61 14 89 5 91 23c1 13-17 20-40 17ZM51 41c14-8 32-4 29 9-3 12-18 12-29-9Z"/>
                        <path class="butterfly-body" d="M50 31c-3 10-3 18 0 27m0-25c-4-8-8-10-12-10m12 10c4-8 8-10 12-10"/>
                    </svg>
                    <svg class="ryex-butterfly butterfly-three" viewBox="0 0 100 76">
                        <path class="butterfly-wing wing-left" d="M49 37C37 12 7 2 8 23c1 14 18 20 39 17ZM49 40C35 34 17 39 20 53c3 12 18 11 29-10Z"/>
                        <path class="butterfly-wing wing-right" d="M51 38C61 14 89 5 91 23c1 13-17 20-40 17ZM51 41c14-8 32-4 29 9-3 12-18 12-29-9Z"/>
                        <path class="butterfly-body" d="M50 31c-3 10-3 18 0 27m0-25c-4-8-8-10-12-10m12 10c4-8 8-10 12-10"/>
                    </svg>
                </div>
                <header class="ryex-welcome">
                    <div>
                        <span class="ryex-eyebrow"><i></i> RYEX PERSONAL COMMAND CENTER</span>
                        <h2>Welcome to <strong>RYEX</strong>, ${escapeHtml(data.account.username)}</h2>
                        <p>Your operations, connections, and activity in one place.</p>
                    </div>
                    <div class="ryex-brand-mark" aria-label="RYEX Panel">
                        <strong>RYEX</strong><span>PANEL</span>
                    </div>
                </header>

                <section class="dashboard-video-hero ryex-video-hero" aria-label="RYEX Panel video">
                    <video class="dashboard-panel-video" autoplay muted loop playsinline preload="auto" aria-label="Video RYEX Panel">
                        <source src="https://files.catbox.moe/r6iqxn.mp4" type="video/mp4">
                    </video>
                    <p class="dashboard-video-error" role="status" hidden>Video panel tidak dapat dimuat. Periksa koneksi lalu muat ulang halaman.</p>
                </section>

                <section class="ryex-metrics" aria-label="Account metrics">
                    <article class="ryex-metric">
                        <span class="ryex-metric-orb online"><i></i></span>
                        <div><span>ACTIVE SESSIONS</span><strong>${stats.activeSenderCount ?? 0}</strong><small>of ${data.senderCount} registered</small></div>
                    </article>
                    <article class="ryex-metric">
                        <span class="ryex-metric-orb messages">${icon("bug")}</span>
                        <div><span>MESSAGES SENT</span><strong>${stats.totalMessages ?? 0}</strong><small>successful activity</small></div>
                    </article>
                    <article class="ryex-metric">
                        <span class="ryex-metric-orb issues">${icon("logs")}</span>
                        <div><span>LOGGED ISSUES</span><strong>${stats.errorCount ?? 0}</strong><small>recent account activity</small></div>
                    </article>
                </section>

                <div class="ryex-workspace">
                    <section class="card ryex-panel ryex-access-panel">
                        <div class="ryex-section-heading">
                            <div><span>YOUR WORKSPACE</span><h3>Quick access</h3></div>
                            <span class="ryex-heading-index">01 / 03</span>
                        </div>
                        <div class="nav-box-grid bottom-navigation ryex-feature-grid">
                            ${navBoxesHtml}
                        </div>
                        ${navToggleHtml}
                    </section>

                    <div class="ryex-ops-column">
                        <a class="card dashboard-chat-launch ryex-chat-launch" href="/chat.html">
                            <span class="dashboard-chat-icon">${icon("whatsapp")}</span>
                            <span class="dashboard-chat-copy"><span class="page-kicker">PRIVATE PANEL CHAT</span><strong>Talk with your team</strong><small>Open a live room with another panel user.</small></span>
                            <span class="dashboard-chat-arrow">${icon("chevron")}</span>
                        </a>

                        <section class="card ryex-panel ryex-status-panel">
                            <div class="ryex-section-heading">
                                <div><span>LIVE MONITORING</span><h3>System status</h3></div>
                                <span class="ryex-status-live"><i></i> LIVE</span>
                            </div>
                            <div class="status-strip ryex-status-grid">
                                ${statusItem("Website", s.web)}
                                ${statusItem("API", s.api)}
                                ${statusItem("Telegram", s.telegram)}
                                ${statusItem("WhatsApp", s.whatsapp)}
                            </div>
                        </section>

                        <section class="card dashboard-notifications ryex-panel ryex-notifications">
                            <div class="ryex-section-heading">
                                <div><span>STAY IN THE LOOP</span><h3>Notifications</h3></div>
                                <span class="notification-count">${notifications.filter((n) => !n.read).length}</span>
                            </div>
                            <div class="notification-list">${notificationMarkup(notifications) || emptyState("No notifications yet", "bell")}</div>
                        </section>
                    </div>
                </div>

                <section class="card ryex-panel ryex-activity-panel">
                    <div class="ryex-section-heading">
                        <div><span>YOUR PANEL TIMELINE</span><h3>Recent activity</h3></div>
                        <span class="ryex-heading-index">03 / 03</span>
                    </div>
                    ${data.recentActivity.length ? `
                        <div class="activity-log ryex-activity-log" role="log" aria-label="Recent activity">
                            ${data.recentActivity.map((l, index) => {
                                const level = l.type === "error" || l.success === false ? "error" : l.type === "auth" ? "auth" : "event";
                                const detail = l.message || l.target || l.number || l.username || "Event processed";
                                return `
                                    <div class="activity-entry ${level} ${index === 0 ? "latest" : ""}">
                                        <span class="activity-marker" aria-hidden="true"></span>
                                        <time class="activity-time">${new Date(l.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time>
                                        <span class="activity-level">${level}</span>
                                        <span class="activity-type">${escapeHtml(l.type || "system")}</span>
                                        <span class="activity-action">${escapeHtml(l.action || "activity")}</span>
                                        <span class="activity-detail">${escapeHtml(detail)}</span>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    ` : emptyState("No activity yet.", "logs")}
                </section>
            </div>
        `;

        const panelVideo = content.querySelector(".dashboard-panel-video");
        panelVideo.addEventListener("error", () => {
            content.querySelector(".dashboard-video-error").hidden = false;
        });
        if (panelVideo.error) content.querySelector(".dashboard-video-error").hidden = false;

        const navToggle = document.getElementById("dashboard-nav-toggle");
        if (navToggle) navToggle.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            navToggle.setAttribute("aria-expanded", String(!expanded));
            navToggle.textContent = expanded ? "Show more" : "Show less";
            document.querySelectorAll(".nav-box-extra").forEach((item) => item.classList.toggle("is-visible", !expanded));
        });

        let notificationSnapshot = JSON.stringify(notifications);
        async function refreshNotificationsOnly() {
            if (document.hidden) return;
            try {
                const fresh = await api("/dashboard");
                const nextItems = Array.isArray(fresh.notifications) ? fresh.notifications : [];
                const root = document.querySelector(".dashboard-notifications");
                if (!root) return;
                const nextSnapshot = JSON.stringify(nextItems);
                if (nextSnapshot === notificationSnapshot) return;
                notificationSnapshot = nextSnapshot;
                const count = nextItems.filter((n) => !n.read).length;
                const badge = root.querySelector(".notification-count");
                if (badge) badge.textContent = String(count);
                const list = root.querySelector(".notification-list");
                if (list) {
                    list.innerHTML = notificationMarkup(nextItems) || emptyState("No notifications yet", "bell");
                }
            } catch {
                // silent polling failure; no user-facing interruption
            }
        }

        setInterval(refreshNotificationsOnly, 5000);
    } catch (err) {
        content.innerHTML = errorState(err.message);
        toast(err.message, "error");
    }
})();