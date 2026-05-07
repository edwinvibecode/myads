import Link from "next/link";

const tabs = [
  { href: "/settings/domains", label: "Domain" },
  { href: "/settings/general", label: "Kurs & Umum" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-white/10 bg-[#080818] px-6">
        <div className="flex gap-1 pt-4">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="px-4 py-2 text-sm text-white/50 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-colors data-[active=true]:text-cyan-400 data-[active=true]:border-cyan-400"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
