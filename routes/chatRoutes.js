const express = require('express');
const router = express.Router();

const { db } = require('../db');
const requireLogin = require('../middleware/requireLogin');


// GET /api/chat/conversations
// Hent alle samtaler hvor den loggede bruger er med

router.get('/conversations', requireLogin, (req, res) => {
    const userId = req.session.user.id;

    db.all(
        `SELECT id, hostId, participantId 
         FROM conversations 
         WHERE hostId = ? OR participantId = ?`,
        [userId, userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            // Simpelt svar – frontend bruger kun id lige nu
            res.json(rows);
        }
    );
});


// POST /api/chat/conversations
// Opret en ny samtale mellem current user og otherUserId
// Body: { "otherUserId": 2 }

router.post('/conversations', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const { otherUserId } = req.body;

    if (!otherUserId) {
        return res.status(400).json({ error: "otherUserId mangler" });
    }

    let hostId, participantId;

    if (role === 'host') {
        hostId = userId;
        participantId = otherUserId;
    } else {
        hostId = otherUserId;
        participantId = userId;
    }

    db.run(
        `INSERT INTO conversations (hostId, participantId) VALUES (?, ?)`,
        [hostId, participantId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({
                id: this.lastID,
                hostId,
                participantId
            });
            }
        );
});

// Hjælper til at tjekke om bruger må se/skriv i samtalen
const assertUserInConversation = (conversationId, userId, callback) => {
    db.get(
        `SELECT id FROM conversations 
         WHERE id = ? AND (hostId = ? OR participantId = ?)`,
        [conversationId, userId, userId],
        (err, row) => {
            if (err) return callback(err);
            if (!row) return callback(null, false);
            callback(null, true);
        }
    );
}


// GET /api/chat/conversations/:id/messages
// Hent alle beskeder i en samtale (hvis bruger er deltager)

router.get('/conversations/:id/messages', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const conversationId = req.params.id;

    assertUserInConversation(conversationId, userId, (err, allowed) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!allowed) return res.status(403).json({ error: "Ingen adgang til denne samtale" });

        db.all(
            `SELECT m.id, m.content, m.timestamp, m.senderId, u.name AS senderName
             FROM messages m
             JOIN users u ON m.senderId = u.id
             WHERE m.conversationId = ?
             ORDER BY m.timestamp ASC`,
            [conversationId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });

                const messages = rows.map(row => ({
                    id: row.id,
                    content: row.content,
                    timestamp: row.timestamp,
                    senderId: row.senderId,
                    senderName: row.senderName,
                    isYou: row.senderId === userId
                }));

                res.json(messages);
            }
        );
    });
});

// POST /api/chat/conversations/:id/messages
// Send en ny besked i en samtale
// Body: { "content": "Hej med dig" }

router.post('/conversations/:id/messages', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: "content mangler" });
    }

    assertUserInConversation(conversationId, userId, (err, allowed) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!allowed) return res.status(403).json({ error: "Ingen adgang til denne samtale" });

        db.run(
            `INSERT INTO messages (conversationId, senderId, content) VALUES (?, ?, ?)`,
            [conversationId, userId, content.trim()],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                    id: this.lastID,
                    conversationId,
                    senderId: userId,
                    content: content.trim()
                });
            }
        );
    });
});

module.exports = router;
