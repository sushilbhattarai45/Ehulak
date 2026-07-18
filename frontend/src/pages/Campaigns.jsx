import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import { CAMPAIGNS_LIST } from "../services/mockData.js";

export default function Campaigns() {
  const columns = [
    {
      key: "name",
      label: "Campaign",
      render: (r) => (
        <div>
          <div className="text-sm text-foreground">{r.name}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{r.id}</div>
        </div>
      ),
    },
    { key: "total", label: "Emails", render: (r) => <span className="font-mono text-sm">{r.total}</span> },
    {
      key: "successRate",
      label: "Success rate",
      render: (r) => (
        <div className="flex items-center gap-2 w-40">
          <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${r.successRate}%` }} />
          </div>
          <span className="font-mono text-xs w-10 text-right">{r.successRate}%</span>
        </div>
      ),
    },
    {
      key: "failureRate",
      label: "Failure rate",
      render: (r) => (
        <span className={`font-mono text-xs ${r.failureRate > 20 ? "text-destructive" : "text-muted-foreground"}`}>
          {r.failureRate}%
        </span>
      ),
    },
    {
      key: "avgRetries",
      label: "Avg retries",
      render: (r) => <span className="font-mono text-xs">{r.avgRetries}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Grouped delivery performance per campaign. Each campaign aggregates its associated email events."
      />
      <DataTable columns={columns} rows={CAMPAIGNS_LIST} />
    </div>
  );
}
