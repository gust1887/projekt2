const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();



const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true,
    maxAge: 1000 * 60 * 60 // 1 time
  }
}));


// Middleware
app.use(express.json());

// HTML-routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'frontpage.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'login.html'));
});

app.get('/createaccount', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'createaccount.html'));
});

app.get('/forgotpassword', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'forgotpassword.html'));
});

app.get('/howdoesbitchatwork', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'howdoesbitchatwork.html'));
});

app.get('/whatweoffer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'whatweoffer.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'chat.html'));
});



// Statisk public-mappe til frontend filer
app.use(express.static(path.join(__dirname, 'public')));

// Henter routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);



const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
