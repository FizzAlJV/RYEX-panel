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
    content.innerHTML = `<div class="skeleton" style="height:190px;margin-bottom:22px"></div>`;

    try {
        let telegramProfile = null;
        try {
            const profileResponse = await api("/auth/telegram-profile");
            telegramProfile = profileResponse.profile;
        } catch (err) {
            toast(`Telegram profile unavailable: ${err.message}`, "error");
        }

        const telegramHandle = telegramProfile?.username || user.username;
        const accountStatus = String(user.status || "active");
        const accountExpiry = user.expiredAt
            ? new Date(user.expiredAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
            : "Lifetime";
        const telegramPhoto = telegramProfile?.photo
            ? `<img src="${escapeHtml(telegramProfile.photo)}" alt="Telegram profile photo">`
            : "";

        content.innerHTML = `
            <section class="card dashboard-telegram-profile" aria-label="Telegram profile">
                <div class="dashboard-telegram-avatar ${telegramProfile?.photo ? "has-photo" : ""}">
                    ${telegramPhoto}
                    <span>${icon("profile")}</span>
                </div>
                <div class="dashboard-telegram-copy">
                    <span class="page-kicker">Account Info</span>
                    <h2>${escapeHtml(telegramProfile?.name || user.username)}</h2>
                    <span class="dashboard-telegram-handle">${escapeHtml(telegramHandle)}</span>
                    <div class="dashboard-account-details">
                        <div><span>Role</span><strong>${escapeHtml(user.role)}</strong></div>
                        <div><span>Username</span><strong>${escapeHtml(user.username)}</strong></div>
                        <div><span>Status</span><strong class="dashboard-account-status">${escapeHtml(accountStatus)}</strong></div>
                        <div><span>Expired</span><strong>${escapeHtml(accountExpiry)}</strong></div>
                    </div>
                </div>
            </section>

            <section class="dashboard-travas" aria-label="Travas menu">
                <div id="dashboard-travas-content" class="page-xmessage"><div class="skeleton" style="height:300px"></div></div>
            </section>
        `;

        const avatarImage = content.querySelector(".dashboard-telegram-avatar img");
        if (avatarImage) avatarImage.addEventListener("error", () => {
            avatarImage.remove();
            content.querySelector(".dashboard-telegram-avatar").classList.remove("has-photo");
        });

        await mountTravas(document.getElementById("dashboard-travas-content"), user, { embedded: true });
    } catch (err) {
        content.innerHTML = errorState(err.message);
        toast(err.message, "error");
    }
})();