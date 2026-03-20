import mysql from 'mysql2/promise';

async function run() {
  const dbUrl = "mysql://UXmNG8BrrJjE2jz.root:TSlW0VJRwiIM0Pd7@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/healthwatch?sslaccept=strict";
  const pool = mysql.createPool({
    uri: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Altering User table photo column to LONGTEXT...");
    await pool.execute('ALTER TABLE User MODIFY photo LONGTEXT');
    console.log("Success!");
  } catch(e) { console.error(e); }
  process.exit();
}

run();
