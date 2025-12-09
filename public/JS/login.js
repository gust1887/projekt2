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
