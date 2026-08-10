import pg from "pg";
import fs from "fs";

const connectionString =
  "postgresql://postgres.qqxnhredlpbtsmltjqmo:G9ttjjK%2F.3RA_3d@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function main() {
  const sql = fs.readFileSync("scratch/import.sql", "utf8");
  console.log("Conectando a la base de datos...");
  const client = new pg.Client({ connectionString });
  await client.connect();
  console.log("Conexión establecida. Ejecutando sentencias SQL...");

  try {
    const res = await client.query(sql);
    console.log("Ejecución completada con éxito.");
  } catch (err) {
    console.error("Error al ejecutar SQL:", err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
