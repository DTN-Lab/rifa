"use server";

import { revalidatePath } from "next/cache";
import {
  registrarParticipante,
  liberarNumero,
  eliminarParticipante,
  ejecutarSorteo,
  getParticipantePorTelefono,
} from "@/lib/queries";

export async function actionRegistrar(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim();
  const numerosRaw = formData.get("numeros") as string;

  if (!nombre || !telefono || !numerosRaw) {
    return { ok: false, error: "Todos los campos son obligatorios" };
  }

  const numeros = numerosRaw
    .split(",")
    .map((n) => parseInt(n.trim()))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 100);

  if (numeros.length === 0) {
    return { ok: false, error: "Selecciona al menos un número" };
  }

  const resultado = await registrarParticipante(nombre, telefono, numeros);
  if (resultado.ok) {
    revalidatePath("/");
    revalidatePath(`/admin/${process.env.ADMIN_PIN}`);
  }
  return resultado;
}

export async function actionLiberarNumero(numero: number) {
  await liberarNumero(numero);
  revalidatePath("/");
  revalidatePath(`/admin/${process.env.ADMIN_PIN}`);
}

export async function actionEjecutarSorteo() {
  const resultado = await ejecutarSorteo();
  if (resultado.ok) {
    revalidatePath(`/admin/${process.env.ADMIN_PIN}/sorteo`);
  }
  return resultado;
}

export async function actionEliminarParticipante(id: number) {
  await eliminarParticipante(id);
  revalidatePath("/");
  revalidatePath(`/admin/${process.env.ADMIN_PIN}`);
}

export async function actionBuscarPorTelefono(telefono: string) {
  return getParticipantePorTelefono(telefono);
}
