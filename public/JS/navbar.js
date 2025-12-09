document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logout-link");
  if (!logoutLink) return;

  // Tjek login-status
  fetch("/api/auth/me")
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        logoutLink.style.display = "inline-block";
      } else {
        logoutLink.style.display = "none";
      }
    })
    .catch(err => {
      console.error("Fejl ved auth-check:", err);
      logoutLink.style.display = "none";
    });

  // Håndter log ud
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  });
});
