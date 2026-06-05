import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Stat from "../components/Stat.jsx";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import RetryCounter from "../components/RetryCounter.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { maskEmail, relativeTime, absoluteTime } from "../lib/format.js";
import { normalizeEvents } from "../lib/emails.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const { emailEvents, getEmailEvents } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");



  const page = emailEvents.page || 1;
  const totalPages = emailEvents.totalPages || 1;

  const events = useMemo(
    () => normalizeEvents(emailEvents.emails),
    [emailEvents.emails],
  );

  const filtered = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        String(e.id || e._id || "")
          .toLowerCase()
          .includes(q) ||
        (e.to || "").toLowerCase().includes(q) ||
        (e.subject || "").toLowerCase().includes(q),
    );
  }, [search, events]);

  const stats = useMemo(
    () => ({
      total: emailEvents.total || 0,
      dlq: emailEvents.dlqTotal || 0,
      sent: emailEvents.sentTotal || 0,
    }),
    [emailEvents.total, emailEvents.dlqTotal, emailEvents.sentTotal],
  );

  const goToPage = async (nextPage) => {
    await getEmailEvents(nextPage);
  };

  const columns = [
    {
      key: "id",
      label: "Email ID",
      render: (r) => <span className="font-mono text-xs text-foreground">{r.id || r._id}</span>,
    },
    {
      key: "to",
      label: "Recipient",
      render: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{maskEmail(r.to)}</span>
      ),
    },
    {
      key: "campaign",
      label: "Campaign",
      render: (r) => <span className="text-xs text-foreground">{r?.campaign || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "retries",
      label: "Retries",
      render: (r) =>
        r.retries > 0 || r.source === "dlq" ? (
          <RetryCounter value={r.retries || (r.source === "dlq" ? 1 : 0)} max={r.maxRetries} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "ts",
      label: "Time",
      render: (r) => (
        <div className="text-xs">
          <div className="text-foreground">{relativeTime(r.timestamp)}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {absoluteTime(r.timestamp)}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Email Events"
        description="Live pipeline of every email passing through the queue → worker → delivery flow. Click any row to inspect its lifecycle."
        actions={
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent transition-base"
              onClick={async () => {
                setRefreshing(true);
                await getEmailEvents(page);
                setRefreshing(false);
              }}
              disabled={refreshing}
              title="Refresh events"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 1 19 5.635"
                />
              </svg>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            {/* <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent transition-base">
              <Download className="h-4 w-4" />
              Export
            </button> */}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat
          label="Total Events"
          value={stats.total.toLocaleString()}
          hint="sent + failed (DLQ)"
        />
        <Stat
          label="Sent"
          value={stats.sent.toLocaleString()}
          hint="delivered successfully"
        />
        <Stat
          label="DLQ"
          value={stats.dlq.toLocaleString()}
          hint="in Dead Letter Queue"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-3 mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, recipient, subject…"
          className="h-8 px-2.5 rounded-md bg-input/60 border border-border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 flex-1 min-w-[200px]"
        />
        <div className="ml-auto text-xs text-muted-foreground font-mono">
          {filtered.length} on this page · {stats.total} total
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(r) => navigate(`/emails/${r.id || r._id}`)}
        empty="No email events match these filters"
      />

      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50"
          onClick={() => page > 1 && goToPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-2 py-1 rounded border border-border text-xs disabled:opacity-50"
          onClick={() => page < totalPages && goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
