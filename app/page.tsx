import { getNumeros } from "@/lib/queries";
import NumeroGrid from "@/components/NumeroGrid";
import PremiosTiers from "@/components/PremiosTiers";

export const dynamic = "force-dynamic";

export default async function PagePublica() {
  const numeros = await getNumeros();
  const vendidos = numeros.filter((n) => n.estado !== "disponible").length;
  const porcentaje = Math.round((vendidos / 100) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-400 to-amber-400 text-white px-4 py-10 text-center">
        <p className="text-sm font-medium uppercase tracking-widest opacity-90 mb-1">
          Rifa Benéfica
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Nuevo Comienzo</h1>
        <div className="max-w-lg mx-auto bg-white/20 backdrop-blur rounded-2xl p-4 text-sm leading-relaxed">
          <p>
            ¡Hola! Somos la <strong>Negra y el Dani</strong>, y estamos viviendo un cambio de
            hogar inesperado. Decidimos pedir ayuda a quienes más queremos: familia y amigos. Más
            que los premios, cada número que adquieras es un apoyo enorme que nos ayuda a seguir
            adelante en esta nueva etapa. ¡Gracias por estar!
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Precio y progreso */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-gray-800">$10.000</p>
              <p className="text-sm text-gray-500">por número</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-rose-500">{vendidos}/100</p>
              <p className="text-sm text-gray-500">números vendidos</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-rose-400 to-amber-400 h-3 rounded-full transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">{porcentaje}% completado</p>
        </div>

        {/* Grilla de números */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-800 mb-1">Números disponibles</h2>
          <div className="flex gap-4 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> Disponible
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> No disponible
            </span>
          </div>
          <NumeroGrid numeros={numeros} />
        </div>

        {/* Premios */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-800 mb-4">Premios</h2>
          <PremiosTiers />
        </div>

        {/* Datos bancarios */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-800 mb-3">Datos para transferencia</h2>
          <p className="text-sm text-gray-500 mb-4">
            Una vez reservado tu número, realiza el depósito y avísanos por WhatsApp.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nombre</span>
              <span className="font-semibold text-gray-800">Paulina Monsalve</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">RUT</span>
              <span className="font-semibold text-gray-800">15.504.956-1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Banco</span>
              <span className="font-semibold text-gray-800">Banco Estado</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tipo de cuenta</span>
              <span className="font-semibold text-gray-800">Cuenta RUT</span>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="font-semibold text-amber-800 mb-1">¿Querés participar?</p>
          <p className="text-sm text-amber-700">
            Contactá directamente a la Negra o al Dani para reservar tu número.
          </p>
        </div>
      </div>
    </main>
  );
}
