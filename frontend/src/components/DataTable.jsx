import { classNames } from "../lib/format.js";

export default function DataTable({ columns, rows, onRowClick, empty }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={classNames(
                    "text-left font-medium text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2.5",
                    c.className
                  )}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  {empty || "No results"}
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick && onRowClick(row)}
                className={classNames(
                  "border-b border-border last:border-0 transition-base",
                  onRowClick && "cursor-pointer hover:bg-accent/60"
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={classNames("px-4 py-3 align-middle", c.cellClassName)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
