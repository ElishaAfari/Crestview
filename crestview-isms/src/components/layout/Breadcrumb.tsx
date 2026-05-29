import Link from "next/link";

export function Breadcrumb({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
      {items.map((item, index) => (
        <span key={item.href}>
          {index > 0 ? <span className="mx-2 text-slate-600">/</span> : null}
          <Link href={item.href} className="hover:text-white">
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
