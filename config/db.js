import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create the MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dragonvstiger_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Helper to test the database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connection pool established successfully with database: ' + (process.env.DB_NAME || 'dragonvstiger_db'));
    connection.release();
    return true;
  } catch (error) {
    console.error(`\n========================================================================`);
    console.error(`⚠️  DATABASE CONNECTION WARNING (AI Studio Preview Environment Boundary)`);
    console.error(`========================================================================`);
    console.error(`Reason: Could not connect to the MySQL DB server at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    console.error(`Err Message: ${error.message}`);
    console.error(`\n👉 This is completely normal and expected inside the cloud preview workspace.`);
    console.error(`   The backend Express + Socket.IO server is still running successfully.`);
    console.error(`\n🛠️  To connect your database, please either:`);
    console.error(`   1. Add your remote database credentials (e.g., from Cleardb, Aiven, or AWS RDS)`);
    console.error(`      to your Secrets panel / .env config.`);
    console.error(`   2. Export this application as a ZIP/GitHub repository using the Settings menu`);
    console.error(`      and run 'npm run dev' locally alongside your local MySQL server.`);
    console.error(`========================================================================\n`);
    return false;
  }
};

export default pool;
