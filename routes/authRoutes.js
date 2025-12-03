const express = require('express');
const router = express.Router();

const { db } = require('../db');
const { hashPassword, validatePassword } = require('../utils/auth');
const { sendMail } = require('../utils/mail');
const crypto = require('crypto');



// Register endpoint
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;
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

    db.get(
        `SELECT password, salt FROM users WHERE email = ?`, [email], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(401).json({ error: "Bruger findes ikke" });
            if (validatePassword(password, row.salt, row.password)) {
                res.json({ message: "Login OK" });
            } else {
                res.status(401).json({ error: "Forkert password" });
            }
        }
    );
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
