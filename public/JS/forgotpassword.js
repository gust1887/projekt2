 document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgot-form");
    const emailInput = document.getElementById("forgot-email");

    if (!form || !emailInput) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        if (!email) {
            alert("Indtast din email");
            return;
        }

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Der skete en fejl ved nulstilling af adgangskoden.");
                return;
            }

            // Vi afslører ikke om emailen fandtes eller ej:
            alert("Hvis emailen findes i systemet, er der sendt en ny adgangskode.");
            window.location.href = "/login";
        } catch (err) {
            console.error(err);
            alert("Der skete en fejl ved kontakt til serveren.");
        }
    });
});
