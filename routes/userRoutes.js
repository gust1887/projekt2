const express = require('express');
const router = express.Router();
const { db } = require('../db');
const requireLogin = require('../middleware/requireLogin');

// GET /api/users
// Returnerer alle brugere undtagen den nuværende (Til at oprette samtaler)
router.get('/', requireLogin, (req, res) => {
  const myId = req.session.user.id;

  db.all(
    `SELECT id, name, email, role
     FROM users
     WHERE id != ?`,
    [myId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
