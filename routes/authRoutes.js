const express = require('express');
const router = express.Router(); //Opretter en mini-router. - Routeren bliver senere koblet på hoved-appen.

const { db } = require('../db'); // Importerer SQLite-forbindelsen. - Bruges til at køre SQL-queries.
const { hashPassword, validatePassword } = require('../utils/auth'); //Importerer jeres kryptografiske funktioner. - hashPassword → bruges ved register & reset. - validatePassword → bruges ved login.
const { sendMail } = require('../utils/mail'); // Bruges til password reset. - SMTP mail via TLS.
const crypto = require('crypto'); //Node’s indbyggede kryptografi-modul. - Bruges til at generere random password ved reset.



// Register endpoint
router.post('/register', (req, res) => { //Når frontend sender: POST /api/auth/register Så kører denne funktion.
    const { name, email, password, role } = req.body; //JSON body bliver parsed af express.json(). - Deconstruction af body.

    if (!name || !email || !password || !role) { //Input validation. - Hvis mangler → 400 Bad Request.
        return res.status(400).json({ error: "Navn, email, password og rolle er påkrævet" });
    }

    const { salt, hash } = hashPassword(password); //HER sker kryptografien: Der genereres salt, Der køres PBKDF2, Der laves hash - Password gemmes aldrig i klartekst.

    db.run(
        `INSERT INTO users (name, email, password, salt, role) VALUES (?, ?, ?, ?, ?)`, //Parameteriseret query (?) - Forhindrer SQL injection - SQLite gemmer hash + salt
        [name, email, hash, salt, role],
         function (err) {
            if (err) {
                // Hvis email allerede findes
                if (err.message.includes("UNIQUE") || err.message.includes("email")) { //Håndterer duplicate email. - Email er UNIQUE i DB.
                    return res.status(400).json({ error: "Email er allerede registreret" });
                }
                return res.status(500).json({ error: "Databasefejl: " + err.message });
            }
            return res.json({ id: this.lastID });
        }
    );
});


// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Hent bruger fra DB
    db.get(
        `SELECT id, name, email, role, password, salt FROM users WHERE email = ?`, //Henter bruger fra DB. - Kun én bruger (email er UNIQUE).
        [email],
        (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: "Bruger findes ikke" }); //Returnerer 401 Unauthorized.

            // Tjek password via validatePassword
            const valid = validatePassword(password, user.salt, user.password); //HER sker password-verificering: 1.Bruger indtaster password, 2.Server tager stored salt, 3.Kører PBKDF2 igen & 4.Sammenligner hash - Det er deterministisk.
            if (!valid) {
                return res.status(401).json({ error: "Forkert password" });
            }

            // Gem brugerinfo i session (uden password og salt)
            req.session.user = { //HER sker det vigtigste: Session state oprettes. Nu gemmes brugerinfo server-side. Browser får cookie med session-id.
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            console.log("User logged in:", req.session.user);

            // Send OK svar til frontend
            return res.json({ success: true }); //Server svarer OK.
        }
    );
});

// Check login status (debug)
router.get('/me', (req, res) => { // Tjekker om req.session.user findes. - Bruges til at se om man er logget ind. - Det er session-baseret authentication.
    if (!req.session.user) {
        return res.status(401).json({ loggedIn: false });
    }
    res.json({ loggedIn: true, user: req.session.user });
});


// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy(() => { // Sletter session server-side. - Session-id bliver invalid. - Cookie bliver useless.
        res.json({ success: true });
    });
});

// Rute til glemt password der genererer ny adgangskode og sender på mail
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email mangler" });

    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => { // Finder bruger.
        if (err) return res.status(500).json({ error: err.message });

        /* For sikkerhed: svar "ok" selv om brugeren ikke findes,
         så man ikke kan gætte hvilke emails der er registreret */
        if (!user) { 
            return res.json({ message: "Hvis emailen findes, er der sendt en ny adgangskode" }); // ANTI-ENUMERATION. - Man afslører ikke om email findes. - Meget flot sikkerhedsdesign.
        }

        // Lav nyt midlertidigt password (12 tegn)
        const newPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12); //Genererer 12-tegn password. - Kryptografisk random.

        // Hash det nye password
        const { salt, hash } = hashPassword(newPassword); //Hashes det nye password. - Samme sikkerhedsmodel som register.

        // Opdater brugerens password + salt
        db.run(
            `UPDATE users SET password = ?, salt = ?, resetToken = NULL WHERE id = ?`, //Opdaterer DB. - ResetToken = NULL (god praksis).
            [hash, salt, user.id],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                // Send mail med nyt password
                sendMail( //Sender nyt password via SMTP. - SMTP kører over TLS.
                    email,
                    'Ny adgangskode til Bit Chat',
                    `Din adgangskode er nu blevet nulstillet.\n\nDin nye adgangskode er: ${newPassword}\n\nLog ind og skift den så hurtigt som muligt.`,
                    `<p>Din adgangskode er nu blevet nulstillet.</p>
                     <p><strong>Ny adgangskode:</strong> ${newPassword}</p>
                     <p>Du kan nu logge ind med denne adgangskode. Gem den et sikkert sted.</p>`
                );

                return res.json({ message: "Hvis emailen findes, er der sendt en ny adgangskode" });
            }
        );
    });
});

module.exports = router;



/*🔥 HVAD DU SKAL FORSTÅ HELT IND TIL BENET

Du skal kunne svare på:

1. Hvor gemmes session? Server memory (via express-session).

2. Hvad ligger i cookie? Kun session-id.

3. Hvorfor kan vi ikke læse password i DB? Fordi det er hashed med salt.

4. Hvordan beskytter TLS login? Krypterer password under transport.

5. Hvad beskytter mod SQL injection? Prepared statements med ? placeholders. */


