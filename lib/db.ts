import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS participantes (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL UNIQUE,
      creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS numeros (
      numero INTEGER PRIMARY KEY,
      participante_id INTEGER REFERENCES participantes(id) ON DELETE SET NULL,
      estado TEXT NOT NULL DEFAULT 'disponible'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS resultados_sorteo (
      id SERIAL PRIMARY KEY,
      numero INTEGER NOT NULL,
      participante_id INTEGER NOT NULL,
      nivel INTEGER NOT NULL,
      sorteado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const [{ total }] = await sql`SELECT COUNT(*) AS total FROM numeros`;
  if (Number(total) === 0) {
    await sql`INSERT INTO numeros (numero) SELECT generate_series(1, 100)`;
  }
}
