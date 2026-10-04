(async function () {
    const user = await guardAuth();
    if (!user) return;

    const content = renderShell(user, "/profile.html");
    setPageTitle("Profile");

    const brand = window.__BRAND__ || {};
    const fallbackName = user.username || brand.webName || "User";
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    const statusText = (user.status || "active").toLowerCase() === "active"
        ? "Active"
        : String(user.status || "Active");

    content.innerHTML = `
        <div class="page-intro"><div><span class="page-kicker">Account center</span><h2>Profile</h2><p>Your Telegram identity and account security.</p></div></div>
        <div class="profile-layout">
            <div class="card profile-identity" id="profile-identity">
                <div class="profile-avatar" id="profile-avatar">${escapeHtml(fallbackName.slice(0, 1).toUpperCase())}</div>
                <span class="profile-telegram-label">TELEGRAM PROFILE</span>
                <h3 id="profile-name">${escapeHtml(fallbackName)}</h3>
                <p id="profile-handle">${escapeHtml(brand.profileLabel || "Telegram account")}</p>
                <span class="pill connected" id="profile-status">${escapeHtml(statusText)}</span>
            </div>
            <div class="card profile-password-card">
                <div class="section-heading"><div><h3>Update password</h3><p>Choose a strong password you do not use elsewhere.</p></div></div>
                <form id="change-password-form" class="profile-password-form">
                    <div class="field"><label for="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required></div>
                    <div class="field"><label for="new-password">New password</label><input id="new-password" name="newPassword" type="password" minlength="8" maxlength="72" autocomplete="new-password" required><small>Use 8-72 characters.</small></div>
                    <div class="field"><label for="password-confirmation">Confirm new password</label><input id="password-confirmation" name="confirmation" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
                    <div class="auth-error" id="password-error"></div>
                    <div class="password-actions"><button class="btn" type="submit" id="change-password-btn">Change password</button></div>
                </form>
            </div>
        </div>
    `;

    try {
        const response = await api("/auth/telegram-profile");
        const profile = response.profile;
        if (profile) {
            if (profile.name) document.getElementById("profile-name").textContent = profile.name;
            if (profile.username) document.getElementById("profile-handle").textContent = profile.username;
            if (profile.photo) {
                const avatar = document.getElementById("profile-avatar");
                const photo = document.createElement("img");
                photo.src = profile.photo;
                photo.alt = `${profile.name || fallbackName} Telegram profile photo`;
                avatar.replaceChildren(photo);
                document.getElementById("profile-identity").classList.add("has-telegram-photo");
            }
            document.getElementById("profile-status").textContent = "Telegram connected";
        } else {
            document.getElementById("profile-handle").textContent = "Telegram profile not linked";
            document.getElementById("profile-status").textContent = "Not connected";
            document.getElementById("profile-status").classList.replace("connected", "disconnected");
        }
    } catch (error) {
        document.getElementById("profile-handle").textContent = "Telegram profile could not be loaded";
        document.getElementById("profile-status").textContent = "Unavailable";
        document.getElementById("profile-status").classList.replace("connected", "disconnected");
        toast(error.message || "Unable to load Telegram profile.", "error");
    }

    document.getElementById("change-password-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = document.getElementById("change-password-btn");
        const error = document.getElementById("password-error");
        const payload = Object.fromEntries(new FormData(form).entries());
        error.textContent = "";
        button.disabled = true;
        try {
            const result = await api("/auth/password", { method: "POST", body: payload });
            toast(result.message || "Password changed successfully.", "success");
            form.reset();
        } catch (err) {
            error.textContent = err.message;
        } finally {
            button.disabled = false;
        }
    });
})();
