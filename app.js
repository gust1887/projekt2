const express = require('express');
const path = require('path');
const app = express();

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

// Husk at slette denne inden aflevering
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'test.html'));
});


// Statisk public-mappe til frontend filer
app.use(express.static(path.join(__dirname, 'public')));

// Henter routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log('Ændrede filer: db.js, routes/authRoutes.js, utils/mail.js, package.json');
  console.log('Glemt kode rute: POST /api/auth/forgot-password med body {"email": "brugers@mail.com"}');
})
