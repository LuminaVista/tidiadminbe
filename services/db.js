import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tidiadmin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
db.getConnection()
  .then(connection => {
    console.log('✅ Database Connected Successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database Connection Error:', err.message);
  });

export default db;