const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Opret tabeller ved serverstart
db.serialize(() => {
    // Brugere for værter og deltagere
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT CHECK(role IN ('host', 'participant')) DEFAULT 'participant'
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


module.exports = { db }