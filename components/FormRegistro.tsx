"use client";

import { useState, useTransition } from "react";
import { actionRegistrar, actionBuscarPorTelefono, actionLiberarNumero, actionEliminarParticipante } from "@/app/actions";

type Numero = { numero: number; estado: string };
type Participante = { id: number; nombre: string; telefono: string; numeros: number[] };

type Props = {
  numerosDisponibles: Numero[];
  participantes: Participante[];
};

export default function FormRegistro({ numerosDisponibles, participantes }: Props) {
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [numerosSeleccionados, setNumerosSeleccionados] = useState<number[]>([]);
  const [participanteExistente, setParticipanteExistente] = useState<Participante | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const disponibles = numerosDisponibles.filter((n) => n.estado === "disponible");

  function toggleNumero(n: number) {
    setNumerosSeleccionados((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  function buscarTelefono() {
    startTransition(async () => {
      const found = await actionBuscarPorTelefono(telefono.trim());
      if (found) {
        setParticipanteExistente(found);
        setNombre(found.nombre);
        setMensaje({ tipo: "ok", texto: `Participante encontrado: ${found.nombre}` });
      } else {
        setParticipanteExistente(null);
        setNombre("");
        setMensaje({ tipo: "error", texto: "No encontrado. Ingresa el nombre para registrar." });
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numerosSeleccionados.length === 0) {
      setMensaje({ tipo: "error", texto: "Selecciona al menos un número" });
      return;
    }
    const fd = new FormData();
    fd.append("nombre", nombre);
    fd.append("telefono", telefono);
    fd.append("numeros", numerosSeleccionados.join(","));

    startTransition(async () => {
      const resultado = await actionRegistrar(fd);
      if (resultado.ok) {
        setMensaje({ tipo: "ok", texto: "¡Registrado con éxito!" });
        setTelefono("");
        setNombre("");
        setNumerosSeleccionados([]);
        setParticipanteExistente(null);
      } else {
        setMensaje({ tipo: "error", texto: resultado.error ?? "Error al registrar" });
      }
    });
  }

  function handleLiberarNumero(numero: number) {
    startTransition(async () => {
      await actionLiberarNumero(numero);
    });
  }

  function handleEliminarParticipante(id: number, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre} y liberar todos sus números?`)) return;
    startTransition(async () => {
      await actionEliminarParticipante(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-bold text-gray-800 text-lg mb-4">Registrar participante</h2>

        {mensaje && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              mensaje.tipo === "ok"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Búsqueda por teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +56912345678"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                required
              />
              <button
                type="button"
                onClick={buscarTelefono}
                disabled={!telefono || isPending}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              disabled={!!participanteExistente}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50 disabled:text-gray-500"
              required
            />
          </div>

          {/* Selector de números */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Números ({disponibles.length} disponibles) — seleccionados:{" "}
              <span className="text-rose-600 font-bold">{numerosSeleccionados.join(", ") || "ninguno"}</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 max-h-56 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
                const estaDisponible = disponibles.some((d) => d.numero === n);
                const seleccionado = numerosSeleccionados.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={!estaDisponible}
                    onClick={() => estaDisponible && toggleNumero(n)}
                    className={`
                      aspect-square text-xs font-semibold rounded-md transition-colors
                      ${!estaDisponible
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : seleccionado
                        ? "bg-rose-400 text-white"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      }
                    `}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || numerosSeleccionados.length === 0}
            className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Guardando..." : `Registrar ${numerosSeleccionados.length > 0 ? `(${numerosSeleccionados.length} número${numerosSeleccionados.length > 1 ? "s" : ""})` : ""}`}
          </button>
        </form>
      </div>

      {/* Lista de participantes */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-bold text-gray-800 text-lg mb-4">
          Participantes registrados ({participantes.length})
        </h2>
        {participantes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No hay participantes aún</p>
        ) : (
          <div className="space-y-3">
            {participantes.map((p) => (
              <div key={p.id} className="border rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{p.nombre}</p>
                    <p className="text-sm text-gray-500">{p.telefono}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-1 rounded-full">
                      {p.numeros.length} número{p.numeros.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleEliminarParticipante(p.id, p.nombre)}
                      disabled={isPending}
                      title="Eliminar participante y liberar todos sus números"
                      className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.numeros.map((n) => (
                    <span
                      key={n}
                      className="group relative inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full"
                    >
                      {n}
                      <button
                        onClick={() => handleLiberarNumero(n)}
                        disabled={isPending}
                        title="Liberar número"
                        className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
