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

// Simpel rute til glemt password der sender nulstillingskode på mail
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email mangler" });

    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });

        const token = crypto.randomBytes(16).toString('hex');

        db.run(`UPDATE users SET resetToken = ? WHERE id = ?`, [token, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            sendMail(
                email,
                'Nulstilling af adgangskode',
                `Du har bedt om at nulstille din adgangskode. Din nulstillingskode er: ${token}`
            );

            res.json({ message: "Reset email sent" });
        });
    });
});

module.exports = router;
