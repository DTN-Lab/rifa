"use client";

import { useState, useTransition } from "react";
import { actionEjecutarSorteo } from "@/app/actions";

type Resultado = {
  numero: number;
  nombre: string;
  telefono: string;
  premio: string;
  nivel: number;
};

type Props = {
  resultadosIniciales: Resultado[];
  numerosVendidos: number;
};

const NIVEL_LABELS: Record<number, { label: string; bg: string; icon: string }> = {
  1: { label: "Nivel 1 — Premios principales", bg: "bg-amber-50 border-amber-300", icon: "🥇" },
  2: { label: "Nivel 2 — Premios intermedios", bg: "bg-slate-50 border-slate-300", icon: "🥈" },
  3: { label: "Nivel 3 — Premios especiales", bg: "bg-orange-50 border-orange-200", icon: "🥉" },
};

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

  const niveles = [1, 2, 3];

  return (
    <div className="space-y-6">
      {/* Botón sorteo */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 text-center">
        <p className="text-gray-600 mb-1">
          <span className="font-bold text-2xl text-gray-800">{numerosVendidos}</span> números vendidos
        </p>
        <p className="text-sm text-gray-400 mb-5">Se sortearán 8 premios entre los participantes</p>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={ejecutar}
          disabled={isPending || numerosVendidos < 8}
          className="bg-gradient-to-r from-rose-400 to-amber-400 text-white font-bold px-8 py-3 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Sorteando..." : resultados.length > 0 ? "Volver a sortear" : "¡Sortear!"}
        </button>

        {numerosVendidos < 8 && (
          <p className="text-xs text-gray-400 mt-2">Necesitás al menos 8 números vendidos</p>
        )}
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">Resultados del sorteo</h2>
          {niveles.map((nivel) => {
            const ganadores = resultados.filter((r) => r.nivel === nivel);
            if (ganadores.length === 0) return null;
            const { label, bg, icon } = NIVEL_LABELS[nivel];
            return (
              <div key={nivel} className={`border rounded-2xl p-4 ${bg}`}>
                <p className="font-semibold text-gray-700 mb-3">
                  {icon} {label}
                </p>
                <div className="space-y-2">
                  {ganadores.map((g) => (
                    <div
                      key={g.numero}
                      className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{g.nombre}</p>
                        <p className="text-xs text-gray-500">{g.telefono}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{g.premio}</p>
                      </div>
                      <div className="text-3xl font-black text-rose-400">#{g.numero}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
