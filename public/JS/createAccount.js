// Hvis brugeren allerede er logget ind, send til chat
fetch("/api/auth/me")
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
        window.location.href = "/chat";
    }
  });

const form = document.getElementById('create-account-form');

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = form.elements['name'].value.trim();
        const email = form.elements['email'].value.trim();
        const password = form.elements['password'].value;
        const role = form.elements['role'].value;

        if (!name || !email || !password || !role) {
            alert("Udfyld venligst alle felter");
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Der skete en fejl ved oprettelse");
                return;
            }

            // Bruger oprettet
            alert("Bruger oprettet! Du kan nu logge ind.");
            window.location.href = '/login';
        } catch (err) {
            console.error('Fejl ved oprettelse:', err);
            alert("Kunne ikke kontakte serveren. Prøv igen.");
        }
    });
}
