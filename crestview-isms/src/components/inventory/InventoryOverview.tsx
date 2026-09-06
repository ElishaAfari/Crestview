import Link from "next/link";
import { ArrowRight, Boxes, ClipboardCheck, MapPin, PackagePlus, Settings2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { loadOperationsModule } from "@/features/operations/queries";

export async function InventoryOverview() {
  const [items, movements, devices, expenses] = await Promise.all([
    loadOperationsModule("inventory", "items"),
    loadOperationsModule("inventory", "movements"),
    loadOperationsModule("inventory", "devices"),
    loadOperationsModule("inventory", "expenses")
  ]);
  if (!items || !movements || !devices || !expenses) return null;

  const lowStock = items.records.filter((record) => {
    const quantity = Number(record.quantity_on_hand ?? 0);
    const reorder = Number(record.reorder_level ?? 0);
    return String(record.status) === "low_stock" || (reorder > 0 && quantity <= reorder);
  }).length;
  const activeItems = items.records.filter((record) => String(record.status ?? "active") !== "retired").length;
  const links = [
    { href: "/inventory/items", label: "Asset register", description: "Register supplies, learning materials, and school assets.", icon: Boxes },
    { href: "/inventory/movements", label: "Stock movements", description: "Record receipts, issues, returns, adjustments, and disposals.", icon: ClipboardCheck },
    { href: "/inventory/categories", label: "Categories", description: "Keep asset classification consistent across the register.", icon: Settings2 },
    { href: "/inventory/locations", label: "Locations", description: "Track where stock and technology assets are held.", icon: MapPin },
    { href: "/inventory/maintenance", label: "Maintenance", description: "Open the maintenance and asset-care workflow.", icon: Wrench },
    { href: "/stores/requisitions", label: "Requisitions", description: "Review supply requests before issue or purchase.", icon: PackagePlus }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Registered assets</span><strong>{items.count}</strong><p>{activeItems} active records in view</p></div>
        <div className="ref-stat"><span>Low stock</span><strong>{lowStock}</strong><p>Items at or below reorder level</p></div>
        <div className="ref-stat"><span>Stock movements</span><strong>{movements.count}</strong><p>Receipts, issues, returns, and adjustments</p></div>
        <div className="ref-stat"><span>Technology assets</span><strong>{devices.count}</strong><p>Devices linked to the IT desk</p></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <span className="ref-avatar"><Icon className="size-5" aria-hidden /></span>
              <ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2>
            <p className="mt-1 text-sm">{description}</p>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Inventory register</CardTitle>
          <p className="text-sm font-semibold text-[var(--portal-muted)]">Search the live asset register by item, category, location, or stock status.</p>
        </CardHeader>
        <CardContent>
          {items.records.length ? <OperationsGenericTable records={items.records} fields={items.module.fields} searchFields={items.module.searchFields} /> : <div className="portal-empty-state"><h3>Set up your asset register</h3><p>Register the first asset to make stock, movement, and reorder tracking live.</p><Link className="ref-button ref-primary mt-4" href="/inventory/items">Register an asset <ArrowRight className="size-4" aria-hidden /></Link></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Procurement activity</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Expenses connected to purchasing and school supplies.</p></CardHeader>
        <CardContent>{expenses.records.length ? <OperationsGenericTable records={expenses.records.slice(0, 10)} fields={expenses.module.fields} searchFields={expenses.module.searchFields} /> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No procurement expenses have been recorded yet.</p>}</CardContent>
      </Card>
    </div>
  );
}
