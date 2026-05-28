import { PREMIOS } from "@/lib/queries";

const TIER_LABELS: Record<number, { label: string; color: string; icon: string }> = {
  1: { label: "Nivel 1 — Premios principales", color: "bg-amber-50 border-amber-300", icon: "🥇" },
  2: { label: "Nivel 2 — Premios intermedios", color: "bg-slate-50 border-slate-300", icon: "🥈" },
  3: { label: "Nivel 3 — Premios especiales", color: "bg-orange-50 border-orange-200", icon: "🥉" },
};

export default function PremiosTiers() {
  const tiers = [1, 2, 3];

  return (
    <div className="space-y-3">
      {tiers.map((nivel) => {
        const premios = PREMIOS.filter((p) => p.nivel === nivel);
        const { label, color, icon } = TIER_LABELS[nivel];
        return (
          <div key={nivel} className={`border rounded-xl p-4 ${color}`}>
            <p className="font-semibold text-gray-700 mb-2 text-sm">
              {icon} {label}
            </p>
            <ul className="space-y-1">
              {premios.map((p) => (
                <li key={p.nombre} className="text-gray-600 text-sm pl-2">
                  • {p.nombre}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
