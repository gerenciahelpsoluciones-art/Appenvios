import { Clock, FileX, Building2 } from "lucide-react";

const BADGES = [
  {
    icon: Clock,
    stat: "< 2 horas",
    label: "Tiempo de respuesta garantizado",
  },
  {
    icon: FileX,
    stat: "Sin contratos",
    label: "Sin permanencia forzosa",
  },
  {
    icon: Building2,
    stat: "+500 empresas",
    label: "Clientes atendidos en Colombia",
  },
];

const TrustBadges = () => {
  return (
    <section className="w-full px-4 py-6 md:px-10 bg-white border-b border-zinc-100">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {BADGES.map(({ icon: Icon, stat, label }) => (
            <div
              key={stat}
              className="flex items-center gap-4 py-4 sm:py-2 sm:px-8 first:pl-0 last:pr-0"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                <Icon size={20} className="text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-zinc-900 font-bold text-base leading-tight">
                  {stat}
                </p>
                <p className="text-zinc-500 text-sm leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
