import { sql } from "./db";

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
  nivel: number;
  premios: string[];
};

export const PREMIOS = [
  { nivel: 1, nombre: "Plumón de cama dos plazas" },
  { nivel: 1, nombre: "Juguera" },
  { nivel: 1, nombre: "Teclado + mouse" },
  { nivel: 2, nombre: "Minipimer" },
  { nivel: 2, nombre: "Hervidor" },
  { nivel: 2, nombre: "Juego de joyas" },
  { nivel: 3, nombre: "Mini ventilador" },
  { nivel: 3, nombre: "Pantuflas" },
  { nivel: 3, nombre: "Bolsito para el frasquito de agua" },
];

export async function getNumeros(): Promise<Numero[]> {
  const rows = await sql`
    SELECT numero, estado, participante_id FROM numeros ORDER BY numero
  `;
  return rows as Numero[];
}

export async function getParticipantes(): Promise<Participante[]> {
  const parts = await sql`
    SELECT id, nombre, telefono FROM participantes ORDER BY creado_en DESC
  `;
  const nums = await sql`
    SELECT numero, participante_id FROM numeros WHERE participante_id IS NOT NULL
  `;

  return parts.map((p) => ({
    id: p.id as number,
    nombre: p.nombre as string,
    telefono: p.telefono as string,
    numeros: (nums as { numero: number; participante_id: number }[])
      .filter((n) => n.participante_id === p.id)
      .map((n) => n.numero)
      .sort((a, b) => a - b),
  }));
}

export async function getParticipantePorTelefono(
  telefono: string
): Promise<Participante | null> {
  const rows = await sql`
    SELECT id, nombre, telefono FROM participantes WHERE telefono = ${telefono}
  `;
  if (rows.length === 0) return null;

  const p = rows[0];
  const nums = await sql`
    SELECT numero FROM numeros WHERE participante_id = ${p.id} ORDER BY numero
  `;

  return {
    id: p.id as number,
    nombre: p.nombre as string,
    telefono: p.telefono as string,
    numeros: nums.map((n) => n.numero as number),
  };
}

export async function registrarParticipante(
  nombre: string,
  telefono: string,
  numeros: number[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const tomados = await sql`
      SELECT numero FROM numeros
      WHERE numero = ANY(${numeros}) AND estado != 'disponible'
    `;
    if (tomados.length > 0) {
      const lista = tomados.map((r) => r.numero).join(", ");
      return { ok: false, error: `Los números ${lista} ya están tomados` };
    }

    const existing = await sql`
      SELECT id FROM participantes WHERE telefono = ${telefono}
    `;

    let participanteId: number;
    if (existing.length > 0) {
      participanteId = existing[0].id as number;
    } else {
      const [row] = await sql`
        INSERT INTO participantes (nombre, telefono) VALUES (${nombre}, ${telefono}) RETURNING id
      `;
      participanteId = row.id as number;
    }

    await sql`
      UPDATE numeros
      SET participante_id = ${participanteId}, estado = 'pagado'
      WHERE numero = ANY(${numeros})
    `;

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

export async function liberarNumero(numero: number): Promise<void> {
  const [row] = await sql`
    SELECT participante_id FROM numeros WHERE numero = ${numero}
  `;
  const participanteId = row?.participante_id as number | null;

  await sql`
    UPDATE numeros SET participante_id = NULL, estado = 'disponible' WHERE numero = ${numero}
  `;

  if (participanteId) {
    const [{ total }] = await sql`
      SELECT COUNT(*) AS total FROM numeros WHERE participante_id = ${participanteId}
    `;
    if (Number(total) === 0) {
      await sql`DELETE FROM participantes WHERE id = ${participanteId}`;
    }
  }
}

export async function eliminarParticipante(id: number): Promise<void> {
  await sql`
    UPDATE numeros SET participante_id = NULL, estado = 'disponible'
    WHERE participante_id = ${id}
  `;
  await sql`DELETE FROM participantes WHERE id = ${id}`;
}

export async function getResultadosSorteo(): Promise<ResultadoSorteo[]> {
  const rows = await sql`
    SELECT r.numero, p.nombre, p.telefono, r.nivel
    FROM resultados_sorteo r
    JOIN participantes p ON p.id = r.participante_id
    ORDER BY r.nivel ASC
  `;
  return rows.map((r) => {
    const nivel = r.nivel as number;
    return {
      numero: r.numero as number,
      nombre: r.nombre as string,
      telefono: r.telefono as string,
      nivel,
      premios: PREMIOS.filter((p) => p.nivel === nivel).map((p) => p.nombre),
    };
  });
}

export async function ejecutarSorteo(): Promise<{
  ok: boolean;
  resultados?: ResultadoSorteo[];
  error?: string;
}> {
  const pool = await sql`
    SELECT n.numero, p.id AS participante_id, p.nombre, p.telefono
    FROM numeros n
    JOIN participantes p ON p.id = n.participante_id
    WHERE n.estado = 'pagado'
  `;

  const niveles = [1, 2, 3];

  if (pool.length < niveles.length) {
    return {
      ok: false,
      error: `Se necesitan al menos ${niveles.length} números vendidos para sortear`,
    };
  }

  await sql`DELETE FROM resultados_sorteo`;

  const resultados: ResultadoSorteo[] = [];
  const usados = new Set<number>();

  for (const nivel of niveles) {
    const disponibles = pool.filter((r) => !usados.has(r.numero as number));
    const ganador = disponibles[Math.floor(Math.random() * disponibles.length)];
    usados.add(ganador.numero as number);

    await sql`
      INSERT INTO resultados_sorteo (numero, participante_id, nivel)
      VALUES (${ganador.numero}, ${ganador.participante_id}, ${nivel})
    `;

    resultados.push({
      numero: ganador.numero as number,
      nombre: ganador.nombre as string,
      telefono: ganador.telefono as string,
      nivel,
      premios: PREMIOS.filter((p) => p.nivel === nivel).map((p) => p.nombre),
    });
  }

  return { ok: true, resultados };
}
