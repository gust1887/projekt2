const express = require('express');
const router = express.Router();

const { db } = require('../db');
const { hashPassword, validatePassword } = require('../utils/auth');



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

module.exports = router;
