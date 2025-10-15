import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'tidi-db-1.c1iqogsuo2yi.ap-southeast-2.rds.amazonaws.com',
  user: 'admin',
  password: 'TC8NlryzoF4gnQjpWqGi',
  database: 'tididb',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = mysql.createPool(dbConfig); // local to this function
      const conn = await pool.getConnection();
      console.log('✅ Database Connected');
      conn.release();
      return pool;
    } catch (err) {
      console.error(`❌ Database connection failed (attempt ${i + 1}/${retries}):`, err.message);
      if (i < retries - 1) {
        console.log(`🔄 Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('🚫 All retry attempts failed. Please check your AWS RDS configuration or network.');
        process.exit(1);
      }
    }
  }
}

const poolPromise = await connectWithRetry();
export default poolPromise;
