"use client";

import { useState, useTransition } from "react";
import { actionEjecutarSorteo } from "@/app/actions";

type Resultado = {
  numero: number;
  nombre: string;
  telefono: string;
  nivel: number;
  premios: string[];
};

type Props = {
  resultadosIniciales: Resultado[];
  numerosVendidos: number;
};

const NIVEL_LABELS: Record<number, { label: string; bg: string; icon: string }> = {
  1: { label: "Grupo 1 — Premios principales", bg: "bg-amber-50 border-amber-300", icon: "🥇" },
  2: { label: "Grupo 2 — Premios intermedios", bg: "bg-slate-50 border-slate-300", icon: "🥈" },
  3: { label: "Grupo 3 — Premios especiales", bg: "bg-orange-50 border-orange-200", icon: "🥉" },
};

const MIN_NUMEROS = 3;

export default function BotonSorteo({ resultadosIniciales, numerosVendidos }: Props) {
  const [resultados, setResultados] = useState<Resultado[]>(resultadosIniciales);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function ejecutar() {
    setError(null);
    startTransition(async () => {
      const res = await actionEjecutarSorteo();
      if (res.ok && res.resultados) {
        setResultados(res.resultados);
      } else {
        setError(res.error ?? "Error al ejecutar el sorteo");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Botón sorteo */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 text-center">
        <p className="text-gray-600 mb-1">
          <span className="font-bold text-2xl text-gray-800">{numerosVendidos}</span> números vendidos
        </p>
        <p className="text-sm text-gray-400 mb-5">Se sortearán 3 ganadores — uno por grupo de premios</p>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={ejecutar}
          disabled={isPending || numerosVendidos < MIN_NUMEROS}
          className="bg-gradient-to-r from-rose-400 to-amber-400 text-white font-bold px-8 py-3 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Sorteando..." : resultados.length > 0 ? "Volver a sortear" : "¡Sortear!"}
        </button>

        {numerosVendidos < MIN_NUMEROS && (
          <p className="text-xs text-gray-400 mt-2">Necesitás al menos {MIN_NUMEROS} números vendidos</p>
        )}
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">Resultados del sorteo</h2>
          {resultados.map((g) => {
            const { label, bg, icon } = NIVEL_LABELS[g.nivel];
            return (
              <div key={g.nivel} className={`border rounded-2xl p-4 ${bg}`}>
                <p className="font-semibold text-gray-700 mb-3">{icon} {label}</p>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{g.nombre}</p>
                      <p className="text-xs text-gray-500">{g.telefono}</p>
                    </div>
                    <div className="text-3xl font-black text-rose-400">#{g.numero}</div>
                  </div>
                  <ul className="space-y-1">
                    {g.premios.map((premio) => (
                      <li key={premio} className="text-sm text-gray-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-300 inline-block flex-shrink-0" />
                        {premio}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
