const express = require('express');
const router = express.Router();

const { db } = require('../db');
const { hashPassword, validatePassword } = require('../utils/auth');
const { sendMail } = require('../utils/mail');
const crypto = require('crypto');



// Register endpoint
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Navn, email, password og rolle er påkrævet" });
    }
    
    const { salt, hash } = hashPassword(password);

    db.run(
        `INSERT INTO users (name, email, password, salt, role) VALUES (?, ?, ?, ?, ?)`,
        [name, email, hash, salt, role],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});


// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Hent bruger fra DB
    db.get(
        `SELECT id, name, email, role, password, salt FROM users WHERE email = ?`,
        [email],
        (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: "Bruger findes ikke" });

            // Tjek password via validatePassword
            const valid = validatePassword(password, user.salt, user.password);
            if (!valid) {
                return res.status(401).json({ error: "Forkert password" });
            }

            // Gem brugerinfo i session (uden password og salt)
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            console.log("User logged in:", req.session.user);

            // Send OK svar til frontend
            return res.json({ success: true });
        }
    );
});

// Check login status (debug)
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ loggedIn: false });
    }
    res.json({ loggedIn: true, user: req.session.user });
});


// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// Rute til glemt password der genererer ny adgangskode og sender på mail
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email mangler" });

    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        /* For sikkerhed: svar "ok" selv om brugeren ikke findes,
         så man ikke kan gætte hvilke emails der er registreret */
        if (!user) {
            return res.json({ message: "Hvis emailen findes, er der sendt en ny adgangskode" });
        }

        // Lav nyt midlertidigt password (12 tegn)
        const newPassword = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);

        // Hash det nye password
        const { salt, hash } = hashPassword(newPassword);

        // Opdater brugerens password + salt
        db.run(
            `UPDATE users SET password = ?, salt = ?, resetToken = NULL WHERE id = ?`,
            [hash, salt, user.id],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                // Send mail med nyt password
                sendMail(
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
