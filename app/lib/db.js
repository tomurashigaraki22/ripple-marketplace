import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root", // or your MySQL user
  password: "", // your MySQL password
  database: "blockcred-sui",
});