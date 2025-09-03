const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./config/db'); // Adjusted import to match the export in db.js

dotenv.config();
const app = express();
const generateUserID = require('./middlewares/generateUserID');
const PORT = process.env.PORT || 4500;



// Store dashboard connections
const clients = [];

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  req.on('close', () => {
    const i = clients.indexOf(res);
    if (i >= 0) clients.splice(i, 1);
  });
});

// Function to notify dashboards
function notifyNewID(newRecord) {
  clients.forEach(res => {
    res.write(`data: ${JSON.stringify(newRecord)}\n\n`);
  });
}

// Make available in controllers
app.set("notifyNewID", notifyNewID);


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

// Serve the contact-us.ejs
app.get('/contact-us', (req, res) => {
  res.render('contact-us'); // this looks for views/contact-us.ejs
});

// Serve the about.ejs
app.get('/about', (req, res) => {
  res.render('about'); // this looks for views/about.ejs
});

// Serve the redirecting-page.ejs
app.get('/redirecting-page', (req, res) => {
  res.render('redirecting-page'); // this looks for views/redirecting-page.ejs
});

// Routes
const generationRoutes = require('./routes/generationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const formRoutes = require('./routes/form');
const statsRoutes = require('./routes/statsRoutes');
const departmentBreakDownRoutes = require('./routes/departmentBreakDownRoutes');

app.use('/', generationRoutes);
app.use('/id-dashboard', dashboardRoutes);
app.use('/', formRoutes);
app.use('/', statsRoutes);
app.use('/', departmentBreakDownRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});