import { db } from "./db";

export type Numero = {
  numero: number;
  estado: string;
  participante_id: number | null;
};

export type Participante = {
  id: number;
  nombre: string;
  telefono: string;
  numeros: number[];
};

export type ResultadoSorteo = {
  numero: number;
  nombre: string;
  telefono: string;
  premio: string;
  nivel: number;
};

export const PREMIOS = [
  { nivel: 1, nombre: "Plumón de cama dos plazas" },
  { nivel: 1, nombre: "Juguera mini Pime" },
  { nivel: 1, nombre: "Hervidor" },
  { nivel: 2, nombre: "Teclado + mouse" },
  { nivel: 2, nombre: "Juego de joyas" },
  { nivel: 2, nombre: "Mini ventilador" },
  { nivel: 3, nombre: "Pantuflas" },
  { nivel: 3, nombre: "Bolsito para el frasquito de agua" },
];

export async function getNumeros(): Promise<Numero[]> {
  const { rows } = await db.execute(
    "SELECT numero, estado, participante_id FROM numeros ORDER BY numero"
  );
  return rows.map((r) => ({
    numero: Number(r.numero),
    estado: String(r.estado),
    participante_id: r.participante_id != null ? Number(r.participante_id) : null,
  }));
}

export async function getParticipantes(): Promise<Participante[]> {
  const { rows: parts } = await db.execute(
    "SELECT id, nombre, telefono FROM participantes ORDER BY creado_en DESC"
  );
  const { rows: nums } = await db.execute(
    "SELECT numero, participante_id FROM numeros WHERE participante_id IS NOT NULL"
  );

  const numeros = nums.map((r) => ({
    numero: Number(r.numero),
    participante_id: Number(r.participante_id),
  }));

  return parts.map((p) => ({
    id: Number(p.id),
    nombre: String(p.nombre),
    telefono: String(p.telefono),
    numeros: numeros
      .filter((n) => n.participante_id === Number(p.id))
      .map((n) => n.numero)
      .sort((a, b) => a - b),
  }));
}

export async function getParticipantePorTelefono(
  telefono: string
): Promise<Participante | null> {
  const { rows } = await db.execute({
    sql: "SELECT id, nombre, telefono FROM participantes WHERE telefono = ?",
    args: [telefono],
  });
  if (rows.length === 0) return null;

  const p = rows[0];
  const { rows: nums } = await db.execute({
    sql: "SELECT numero FROM numeros WHERE participante_id = ? ORDER BY numero",
    args: [p.id],
  });

  return {
    id: Number(p.id),
    nombre: String(p.nombre),
    telefono: String(p.telefono),
    numeros: nums.map((n) => Number(n.numero)),
  };
}

export async function registrarParticipante(
  nombre: string,
  telefono: string,
  numeros: number[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Verificar que todos los números estén disponibles
    const placeholders = numeros.map(() => "?").join(",");
    const { rows } = await db.execute({
      sql: `SELECT numero FROM numeros WHERE numero IN (${placeholders}) AND estado != 'disponible'`,
      args: numeros,
    });
    if (rows.length > 0) {
      const tomados = rows.map((r) => Number(r.numero)).join(", ");
      return { ok: false, error: `Los números ${tomados} ya están tomados` };
    }

    // Buscar o crear participante
    let participanteId: number;
    const { rows: existing } = await db.execute({
      sql: "SELECT id FROM participantes WHERE telefono = ?",
      args: [telefono],
    });

    if (existing.length > 0) {
      participanteId = Number(existing[0].id);
    } else {
      const result = await db.execute({
        sql: "INSERT INTO participantes (nombre, telefono) VALUES (?, ?)",
        args: [nombre, telefono],
      });
      participanteId = Number(result.lastInsertRowid);
    }

    // Asignar números
    for (const num of numeros) {
      await db.execute({
        sql: "UPDATE numeros SET participante_id = ?, estado = 'pagado' WHERE numero = ?",
        args: [participanteId, num],
      });
    }

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

export async function liberarNumero(numero: number): Promise<void> {
  await db.execute({
    sql: "UPDATE numeros SET participante_id = NULL, estado = 'disponible' WHERE numero = ?",
    args: [numero],
  });
}

export async function getResultadosSorteo(): Promise<ResultadoSorteo[]> {
  const { rows } = await db.execute(`
    SELECT r.numero, p.nombre, p.telefono, r.premio, r.nivel
    FROM resultados_sorteo r
    JOIN participantes p ON p.id = r.participante_id
    ORDER BY r.nivel ASC, r.id ASC
  `);
  return rows.map((r) => ({
    numero: Number(r.numero),
    nombre: String(r.nombre),
    telefono: String(r.telefono),
    premio: String(r.premio),
    nivel: Number(r.nivel),
  }));
}

export async function ejecutarSorteo(): Promise<{ ok: boolean; resultados?: ResultadoSorteo[]; error?: string }> {
  // Obtener todos los números pagados
  const { rows } = await db.execute(`
    SELECT n.numero, p.id as participante_id, p.nombre, p.telefono
    FROM numeros n
    JOIN participantes p ON p.id = n.participante_id
    WHERE n.estado = 'pagado'
  `);

  const pool = rows.map((r) => ({
    numero: Number(r.numero),
    participante_id: Number(r.participante_id),
    nombre: String(r.nombre),
    telefono: String(r.telefono),
  }));

  if (pool.length < PREMIOS.length) {
    return { ok: false, error: `Se necesitan al menos ${PREMIOS.length} números vendidos para sortear` };
  }

  // Limpiar sorteos anteriores
  await db.execute("DELETE FROM resultados_sorteo");

  const resultados: ResultadoSorteo[] = [];
  const usados = new Set<number>();

  for (const premio of PREMIOS) {
    const disponibles = pool.filter((r) => !usados.has(r.numero));
    const ganador = disponibles[Math.floor(Math.random() * disponibles.length)];
    usados.add(ganador.numero);

    await db.execute({
      sql: "INSERT INTO resultados_sorteo (numero, participante_id, premio, nivel) VALUES (?, ?, ?, ?)",
      args: [ganador.numero, ganador.participante_id, premio.nombre, premio.nivel],
    });

    resultados.push({
      numero: ganador.numero,
      nombre: ganador.nombre,
      telefono: ganador.telefono,
      premio: premio.nombre,
      nivel: premio.nivel,
    });
  }

  return { ok: true, resultados };
}
