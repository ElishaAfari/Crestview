import Link from "next/link";

export function Breadcrumb({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-semibold text-[var(--portal-muted)]">
      {items.map((item, index) => (
        <span key={item.href}>
          {index > 0 ? <span className="mx-2 text-[var(--portal-muted)]">/</span> : null}
          <Link href={item.href} className="hover:text-[var(--portal-text)]">
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
