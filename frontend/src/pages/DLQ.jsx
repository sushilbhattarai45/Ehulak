import { useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { maskEmail, relativeTime, absoluteTime } from "../lib/format.js";

export default function DLQ() {
  const [retried, setRetried] = useState({});
  const { dlqEmails, getDLQEmails } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const dlq = dlqEmails.emails || [];
  const page = dlqEmails.page || 1;
  const totalPages = dlqEmails.totalPages || 1;

  const columns = [
    { key: "id", label: "Email ID", render: (r) => <span className="font-mono text-xs">{r.id || r._id}</span> },
    {
      key: "recipient",
      label: "Recipient",
      render: (r) => <span className="font-mono text-xs text-muted-foreground">{maskEmail(r.to)}</span>,
    },
    {
      key: "reason",
      label: "Failure reason",
      render: (r) => (
        <div className="text-xs text-muted-foreground max-w-[240px] truncate" title={r.errorMessage}>
          {r.errorMessage || "No error message"}
        </div>
      ),
    },
    {
      key: "campaign",
      label: "Campaign",
      render: (r) => <span className="text-xs">{r.subject || "—"}</span>,
    },
    {
      key: "ts",
      label: "Failed",
      render: (r) => (
        <div className="text-xs">
          <div className="text-foreground">{relativeTime(r.timestamp)}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {absoluteTime(r.timestamp)}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      label: "",
      render: (r) => {
        const rowId = r.id || r._id;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRetried((m) => ({ ...m, [rowId]: true }));
            }}
            disabled={retried[rowId]}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border text-[11px] hover:bg-accent transition-base disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            {retried[rowId] ? "Requeued" : "Retry"}
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dead Letter Queue"
        description="Emails that exhausted their retry budget. Inspect the failure reason and manually requeue if appropriate."
        actions={
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent transition-base"
            onClick={async () => {
              setRefreshing(true);
              await getDLQEmails(page);
              setRefreshing(false);
            }}
            disabled={refreshing}
            title="Refresh DLQ"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />
      <DataTable columns={columns} rows={dlq} empty="DLQ is empty — nice." />

      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50"
          onClick={() => page > 1 && getDLQEmails(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50"
          onClick={() => page < totalPages && getDLQEmails(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
