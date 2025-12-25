import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool.js";

async function main() {
  const filePath = path.join(__dirname, "migrations", "001_init.sql");
  const sql = fs.readFileSync(filePath, "utf-8");
  await pool.query(sql);
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
