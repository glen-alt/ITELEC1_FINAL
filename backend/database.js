import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_astra_connect',
  waitForConnections: true,
  connectionLimit: 10,
});

// Optional: check the database is reachable when the server starts
try {
  const conn = await connection.getConnection();
  console.log('Connected to the MySQL database.');
  conn.release(); // always give the connection back to the pool
} catch (error) {
  console.error('Error connecting to the MySQL database:', error);
  throw error;
}

export default connection;