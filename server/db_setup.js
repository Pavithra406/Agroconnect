import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "pavi",
  database: "agroconnect",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function setup() {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL connected");

    connection.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ Setup failed:", err.message);
    process.exit(1);
  }
}

setup();
