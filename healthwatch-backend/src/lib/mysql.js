import mysql from 'mysql2/promise';

// TiDB requires SSL to connect. We pass the connection string directly.
// mysql2 usually parses the mysql:// URL correctly.
const dbUrl = process.env.DATABASE_URL;

const pool = mysql.createPool({
  uri: dbUrl,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
});

export default pool;
