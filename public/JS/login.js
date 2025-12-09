// Hvis brugeren allerede er logget ind, send til chat
fetch("/api/auth/me")
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
        window.location.href = "/chat";
    }
  })
  .catch(() => {});

const form = document.getElementById('login-form');

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = form.elements['email'].value;
        const password = form.elements['password'].value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Der skete en fejl ved login');
                return;
            }

            window.location.href = '/chat'; // Redirect til chat siden efter succesfuldt login
        } catch (err) {
            console.error(err);
            alert('Serveren svarede ikke. Prøv igen.');
        }
    });
}
