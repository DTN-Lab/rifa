type Props = {
  numeros: { numero: number; estado: string }[];
};

export default function NumeroGrid({ numeros }: Props) {
  return (
    <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
      {numeros.map(({ numero, estado }) => {
        const disponible = estado === "disponible";
        return (
          <div
            key={numero}
            title={disponible ? `Número ${numero} — disponible` : `Número ${numero} — no disponible`}
            className={`
              aspect-square flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold
              select-none transition-colors
              ${disponible
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-gray-200 text-gray-400 border border-gray-300 line-through"
              }
            `}
          >
            {numero}
          </div>
        );
      })}
    </div>
  );
}
