const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());

// Middleware
app.use(express.json());

// Statisk public-mappe til frontend filer
app.use(express.static(path.join(__dirname, 'public')));

// Henter routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


