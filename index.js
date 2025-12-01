const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const crypto = require('crypto');


const app = express();
app.use(express.json());

const port = 3000;


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// Opret tabeller ved serverstart
db.serialize(() => {
  // Brugere for værter og deltagere
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL
  )`);

  // Samtaler
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostId INTEGER,
    participantId INTEGER,
    FOREIGN KEY(hostId) REFERENCES users(id),
    FOREIGN KEY(participantId) REFERENCES users(id)
  )`);

  // Beskeder
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER,
    senderId INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversationId) REFERENCES conversations(id),
    FOREIGN KEY(senderId) REFERENCES users(id)
  )`);
});


// Hash funktion
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function validatePassword(password, salt, hash) {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

// Register endpoint
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const { salt, hash } = hashPassword(password);
  db.run(`INSERT INTO users (name, email, password, salt) VALUES (?, ?, ?, ?)`,
    [name, email, hash, salt],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT password, salt FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Bruger findes ikke" });
    if (validatePassword(password, row.salt, row.password)) {
      res.json({ message: "Login OK" });
    } else {
      res.status(401).json({ error: "Forkert password" });
    }
  });
});