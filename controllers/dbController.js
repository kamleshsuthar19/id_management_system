const db = require('../config/db');

exports.getAllUsers = (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('DB connection error:', err);
      return res.status(500).send('Database connection failed');
    }

    connection.query('SELECT * FROM users', (error, results) => {
      connection.release();

      if (error) {
        console.error('Query error:', error);
        return res.status(500).send('Query failed');
      }

      res.json(results);
    });
  });
};