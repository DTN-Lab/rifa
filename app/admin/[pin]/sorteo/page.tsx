import { notFound } from "next/navigation";
import { getNumeros, getResultadosSorteo } from "@/lib/queries";
import BotonSorteo from "@/components/BotonSorteo";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pin: string }> };

export default async function PageSorteo({ params }: Props) {
  const { pin } = await params;
  if (pin !== (process.env.ADMIN_PIN ?? "1573")) notFound();

  const [numeros, resultados] = await Promise.all([getNumeros(), getResultadosSorteo()]);
  const vendidos = numeros.filter((n) => n.estado !== "disponible").length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-800">Sorteo — Rifa Nuevo Comienzo</h1>
            <p className="text-sm text-gray-500">{vendidos}/100 números vendidos</p>
          </div>
          <Link
            href={`/admin/${pin}`}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Volver al registro
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <BotonSorteo resultadosIniciales={resultados} numerosVendidos={vendidos} />
      </div>
    </main>
  );
}
