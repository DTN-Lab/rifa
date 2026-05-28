import { notFound } from "next/navigation";
import { getNumeros, getParticipantes } from "@/lib/queries";
import FormRegistro from "@/components/FormRegistro";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pin: string }> };

export default async function PageAdmin({ params }: Props) {
  const { pin } = await params;
  if (pin !== (process.env.ADMIN_PIN ?? "1573")) notFound();

  const [numeros, participantes] = await Promise.all([getNumeros(), getParticipantes()]);
  const vendidos = numeros.filter((n) => n.estado !== "disponible").length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-800">Admin — Rifa Nuevo Comienzo</h1>
            <p className="text-sm text-gray-500">{vendidos}/100 números vendidos</p>
          </div>
          <Link
            href={`/admin/${pin}/sorteo`}
            className="bg-gradient-to-r from-rose-400 to-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Ir al sorteo →
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <FormRegistro numerosDisponibles={numeros} participantes={participantes} />
      </div>
    </main>
  );
}
