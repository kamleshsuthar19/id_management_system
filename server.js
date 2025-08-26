const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./config/db'); // Adjusted import to match the export in db.js

dotenv.config();
const app = express();
const generateUserID = require('./middlewares/generateUserID');
const PORT = process.env.PORT || 4500;

// Other middleware like body-parser, multer, etc.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.originalUrl}`);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'Public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Test DB connection (fail fast)
app.get('/test-db', (req, res) => {
  db.query('SELECT NOW() AS time', (err, results) => {
    if (err) return res.status(500).send('Database query failed');
    res.json(results);
  });
});

// Serve the home.ejs
app.get('/', (req, res) => {
  res.render('home'); // Express will look for /views/home.ejs
});

// Routes
const generationRoutes = require('./routes/generationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const formRoutes = require('./routes/form');

app.use('/', generationRoutes);
app.use('/id-dashboard', dashboardRoutes);
app.use('/', formRoutes);


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});