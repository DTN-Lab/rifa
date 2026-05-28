import { createClient } from "@libsql/client";
import path from "path";

const dbPath = path.join(process.cwd(), "rifa.db");

export const db = createClient({
  url: `file:${dbPath}`,
});

export async function initDB() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS participantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL UNIQUE,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS numeros (
      numero INTEGER PRIMARY KEY,
      participante_id INTEGER REFERENCES participantes(id) ON DELETE SET NULL,
      estado TEXT NOT NULL DEFAULT 'disponible'
    );

    CREATE TABLE IF NOT EXISTS resultados_sorteo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL,
      participante_id INTEGER NOT NULL,
      premio TEXT NOT NULL,
      nivel INTEGER NOT NULL,
      sorteado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Inicializar los 100 números si no existen
  const { rows } = await db.execute("SELECT COUNT(*) as total FROM numeros");
  if ((rows[0].total as number) === 0) {
    const values = Array.from({ length: 100 }, (_, i) => `(${i + 1})`).join(",");
    await db.execute(`INSERT INTO numeros (numero) VALUES ${values}`);
  }
}
