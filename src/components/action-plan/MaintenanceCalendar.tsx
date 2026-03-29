/** Simple month grid for print-friendly maintenance guidance (spec §9.3). */

const ROWS: { month: string; tasks: string }[] = [
  { month: "Jan", tasks: "Storm-proofing; prune dead wood when dry." },
  { month: "Feb", tasks: "Irrigation check; order bare-root or early-season stock." },
  { month: "Mar", tasks: "Clean roofs/gutters; refresh mulch away from siding." },
  { month: "Apr", tasks: "Weed and irrigate new plantings; fertilize only if soils warrant." },
  { month: "May", tasks: "Raise shrub skirts; remove ladder fuels before heat arrives." },
  { month: "Jun", tasks: "Deep water ahead of heat waves; audit drip emitters." },
  { month: "Jul", tasks: "Monitor drought stress; avoid heavy pruning during heat." },
  { month: "Aug", tasks: "Fuel reduction focus in Zone 1–2; chip or dispose of debris." },
  { month: "Sep", tasks: "Reseed cool-season groundcover; plan fall installs." },
  { month: "Oct", tasks: "Leaf litter control near structures; audit irrigation shutoff." },
  { month: "Nov", tasks: "Winterize hoses; plant spring-blooming bulbs where allowed." },
  { month: "Dec", tasks: "Document changes; update this plan after major storms." },
];

export function MaintenanceCalendar() {
  return (
    <section className="mt-10 space-y-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Maintenance calendar</h2>
      <p className="text-sm text-[var(--muted)]">
        High-level PNW reminders—adapt to your elevation, snowpack, and local burn window.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="py-2 pr-4 font-semibold">Month</th>
              <th className="py-2 font-semibold">Focus</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.month} className="border-b border-black/5">
                <td className="py-2 pr-4 font-semibold text-[var(--foreground)]">{row.month}</td>
                <td className="py-2 text-[var(--muted)]">{row.tasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
