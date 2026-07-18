import PageHeader from "../components/PageHeader.jsx";

export default function Analytics() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Delivery, retry, and DLQ trends across all campaigns. Placeholder — charts coming soon."
      />
      <div className="grid grid-cols-2 gap-4">
        {["Delivery rate (7d)", "Retry distribution", "Failure reasons", "Throughput per worker"].map((t) => (
          <div key={t} className="rounded-lg border border-border bg-card p-6 h-64 flex flex-col">
            <div className="text-sm font-medium">{t}</div>
            <div className="text-xs text-muted-foreground mt-1">Coming soon</div>
            <div className="flex-1 mt-4 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              chart placeholder
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
