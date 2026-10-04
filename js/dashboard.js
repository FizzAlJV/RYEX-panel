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
        const s = data.systemStatus;
        const stats = data.stats || {};
        const notifications = Array.isArray(data.notifications) ? data.notifications : [];
        const unreadNotificationCount = (items) => items.filter((notification) => !notification.read).length;
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
                        <div class="ryex-welcome-actions">
                            <div class="ryex-notification-wrap">
                                <button class="ryex-notification-toggle" type="button" data-notification-toggle aria-label="Notifications, ${unreadNotificationCount(notifications)} unread" aria-haspopup="true" aria-expanded="false" aria-controls="dashboard-notification-panel">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
                                    <span class="ryex-notification-badge" data-notification-count${unreadNotificationCount(notifications) ? "" : " hidden"}>${unreadNotificationCount(notifications)}</span>
                                </button>
                                <section class="ryex-notification-popover" id="dashboard-notification-panel" data-notification-panel aria-label="Notifications" hidden>
                                    <div class="ryex-notification-heading"><strong>Notifications</strong><span data-notification-summary>${unreadNotificationCount(notifications)} unread</span></div>
                                    <div class="notification-list" data-notification-list>${notificationMarkup(notifications) || emptyState("No notifications yet", "bell")}</div>
                                </section>
                            </div>
                            <div class="ryex-brand-mark" aria-label="RYEX Panel">
                                <strong>RYEX</strong><span>PANEL</span>
                            </div>
                        </div>
                </header>

                <section class="dashboard-video-hero ryex-video-hero" aria-label="RYEX Panel video">
                    <video class="dashboard-panel-video" autoplay muted loop playsinline preload="auto" aria-label="Video RYEX Panel">
                        <source src="https://files.catbox.moe/r6iqxn.mp4" type="video/mp4">
                    </video>
                    <p class="dashboard-video-error" role="status" hidden>Video tidak dapat dimainkan. Sila cuba lagi kemudian.</p>
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
                            <div><span>YOUR WORKSPACE</span><h3>All functions</h3></div>
                            <span class="ryex-heading-index">${dashboardNavItems.length} available</span>
                        </div>
                        ${dashboardNavItems.length ? `
                            <div class="ryex-carousel" data-workspace-carousel aria-label="Workspace functions">
                                <div class="ryex-carousel-stage" data-carousel-stage aria-live="off">
                                    ${dashboardNavItems.map((item, index) => `
                                        <a class="ryex-carousel-slide" href="${escapeHtml(item.href)}" data-carousel-slide="${index}" aria-label="${index + 1} of ${dashboardNavItems.length}: ${escapeHtml(item.label)}">
                                            <article class="ryex-carousel-card">
                                                <img class="ryex-carousel-watermark" src="/assets/shoyu-logo.svg" alt="" aria-hidden="true">
                                                <div class="ryex-carousel-card-top">
                                                    <span class="ryex-carousel-number">${String(index + 1).padStart(2, "0")}</span>
                                                    ${icon(item.icon, "ryex-carousel-icon")}
                                                </div>
                                                <div class="ryex-carousel-copy">
                                                    <span>WORKSPACE FUNCTION</span>
                                                    <h4>${escapeHtml(item.label)}</h4>
                                                    <p>${escapeHtml(item.sub)}</p>
                                                </div>
                                                <div class="ryex-carousel-open">Open function ${icon("chevron")}</div>
                                            </article>
                                        </a>
                                    `).join("")}
                                </div>
                                <div class="ryex-carousel-controls">
                                    <button class="ryex-carousel-arrow" type="button" data-carousel-prev aria-label="Previous function">${icon("back")}</button>
                                    <div class="ryex-carousel-indicators" role="group" aria-label="Choose a workspace function">
                                        ${dashboardNavItems.map((item, index) => `<button class="ryex-carousel-indicator${index === 0 ? " is-active" : ""}" type="button" data-carousel-go="${index}" aria-label="Show ${escapeHtml(item.label)}"${index === 0 ? ' aria-current="true"' : ""}></button>`).join("")}
                                    </div>
                                    <span class="ryex-carousel-count"><span data-carousel-current>01</span> / ${String(dashboardNavItems.length).padStart(2, "0")}</span>
                                    <button class="ryex-carousel-arrow" type="button" data-carousel-next aria-label="Next function">${icon("chevron")}</button>
                                </div>
                                <span class="sr-only" data-carousel-status aria-live="polite"></span>
                            </div>
                        ` : emptyState("No workspace functions are available for this account.", "system")}
                    </section>
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

                <section class="ryex-ops-column ryex-ops-below" aria-label="Panel operations">
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
                </section>
            </div>
        `;

        const panelVideo = content.querySelector(".dashboard-panel-video");
        const panelVideoError = content.querySelector(".dashboard-video-error");
        panelVideo.addEventListener("error", () => {
            panelVideoError.hidden = false;
        });
        const clearPanelVideoError = () => { panelVideoError.hidden = true; };
        panelVideo.addEventListener("loadeddata", clearPanelVideoError);
        panelVideo.addEventListener("playing", clearPanelVideoError);
        if (panelVideo.error) panelVideoError.hidden = false;

        const notificationToggle = content.querySelector("[data-notification-toggle]");
        const notificationPanel = content.querySelector("[data-notification-panel]");
        const closeNotifications = () => {
            notificationPanel.hidden = true;
            notificationToggle.setAttribute("aria-expanded", "false");
        };
        notificationToggle.addEventListener("click", () => {
            const isOpen = notificationToggle.getAttribute("aria-expanded") === "true";
            notificationToggle.setAttribute("aria-expanded", String(!isOpen));
            notificationPanel.hidden = isOpen;
        });
        document.addEventListener("click", (event) => {
            if (!notificationPanel.hidden && !notificationPanel.contains(event.target) && !notificationToggle.contains(event.target)) {
                closeNotifications();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !notificationPanel.hidden) {
                closeNotifications();
                notificationToggle.focus();
            }
        });

        const workspaceCarousel = content.querySelector("[data-workspace-carousel]");
        if (workspaceCarousel) {
            const slides = [...workspaceCarousel.querySelectorAll("[data-carousel-slide]")];
            const indicators = [...workspaceCarousel.querySelectorAll("[data-carousel-go]")];
            const currentLabel = workspaceCarousel.querySelector("[data-carousel-current]");
            const liveStatus = workspaceCarousel.querySelector("[data-carousel-status]");
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
            let currentIndex = 0;
            let autoplayTimer;
            let pointerStartX = null;
            let suppressClickUntil = 0;

            const updateCarousel = (nextIndex, announce = false) => {
                currentIndex = (nextIndex + slides.length) % slides.length;
                slides.forEach((slide, index) => {
                    let offset = index - currentIndex;
                    if (offset > slides.length / 2) offset -= slides.length;
                    if (offset < -slides.length / 2) offset += slides.length;

                    const distance = Math.abs(offset);
                    const position = distance === 0 ? "active" : distance === 1 ? (offset < 0 ? "previous" : "next") : "hidden";
                    slide.dataset.position = position;
                    slide.setAttribute("aria-hidden", String(distance !== 0));
                    slide.inert = distance !== 0;
                });
                indicators.forEach((indicator, index) => {
                    const isActive = index === currentIndex;
                    indicator.classList.toggle("is-active", isActive);
                    if (isActive) indicator.setAttribute("aria-current", "true");
                    else indicator.removeAttribute("aria-current");
                });
                currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
                if (announce) liveStatus.textContent = `${slides[currentIndex].querySelector("h4").textContent}, ${currentIndex + 1} of ${slides.length}`;
            };
            const stopAutoplay = () => {
                window.clearInterval(autoplayTimer);
                autoplayTimer = undefined;
            };
            const startAutoplay = () => {
                stopAutoplay();
                if (reducedMotion.matches || slides.length < 2 || document.hidden) return;
                autoplayTimer = window.setInterval(() => updateCarousel(currentIndex + 1), 6000);
            };

            workspaceCarousel.querySelector("[data-carousel-prev]").addEventListener("click", () => {
                updateCarousel(currentIndex - 1, true);
                startAutoplay();
            });
            workspaceCarousel.querySelector("[data-carousel-next]").addEventListener("click", () => {
                updateCarousel(currentIndex + 1, true);
                startAutoplay();
            });
            indicators.forEach((indicator) => indicator.addEventListener("click", () => {
                updateCarousel(Number(indicator.dataset.carouselGo), true);
                startAutoplay();
            }));
            workspaceCarousel.addEventListener("click", (event) => {
                if (Date.now() < suppressClickUntil) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                const slide = event.target.closest("[data-carousel-slide]");
                if (slide && slide.dataset.position !== "active") {
                    event.preventDefault();
                    updateCarousel(Number(slide.dataset.carouselSlide), true);
                    startAutoplay();
                }
            });
            workspaceCarousel.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                updateCarousel(currentIndex + (event.key === "ArrowRight" ? 1 : -1), true);
                startAutoplay();
            });
            workspaceCarousel.addEventListener("pointerdown", (event) => {
                if (event.isPrimary) pointerStartX = event.clientX;
            });
            workspaceCarousel.addEventListener("pointerup", (event) => {
                if (pointerStartX === null) return;
                const distance = event.clientX - pointerStartX;
                pointerStartX = null;
                if (Math.abs(distance) < 45) return;
                suppressClickUntil = Date.now() + 400;
                updateCarousel(currentIndex + (distance < 0 ? 1 : -1), true);
                startAutoplay();
            });
            workspaceCarousel.addEventListener("pointercancel", () => { pointerStartX = null; });
            workspaceCarousel.addEventListener("pointerenter", stopAutoplay);
            workspaceCarousel.addEventListener("pointerleave", startAutoplay);
            workspaceCarousel.addEventListener("focusin", stopAutoplay);
            workspaceCarousel.addEventListener("focusout", (event) => {
                if (!workspaceCarousel.contains(event.relatedTarget)) startAutoplay();
            });
            document.addEventListener("visibilitychange", startAutoplay);
            reducedMotion.addEventListener("change", startAutoplay);

            updateCarousel(0);
            startAutoplay();
        }

        let notificationSnapshot = JSON.stringify(notifications);
        async function refreshNotificationsOnly() {
            if (document.hidden) return;
            try {
                const fresh = await api("/dashboard");
                const nextItems = Array.isArray(fresh.notifications) ? fresh.notifications : [];
                const notificationPanel = document.querySelector("[data-notification-panel]");
                const notificationToggle = document.querySelector("[data-notification-toggle]");
                if (!notificationPanel || !notificationToggle) return;
                const nextSnapshot = JSON.stringify(nextItems);
                if (nextSnapshot === notificationSnapshot) return;
                notificationSnapshot = nextSnapshot;
                const count = unreadNotificationCount(nextItems);
                const badge = notificationToggle.querySelector("[data-notification-count]");
                const summary = notificationPanel.querySelector("[data-notification-summary]");
                const list = notificationPanel.querySelector("[data-notification-list]");
                badge.textContent = String(count);
                badge.hidden = count === 0;
                notificationToggle.setAttribute("aria-label", `Notifications, ${count} unread`);
                summary.textContent = `${count} unread`;
                list.innerHTML = notificationMarkup(nextItems) || emptyState("No notifications yet", "bell");
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