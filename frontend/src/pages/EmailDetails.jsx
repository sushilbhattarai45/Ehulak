import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import RetryCounter from "../components/RetryCounter.jsx";
import Timeline from "../components/Timeline.jsx";
import { maskEmail, absoluteTime, relativeTime } from "../lib/format.js";
import { normalizeEvent, buildTimelineFromWorkerHistory } from "../lib/emails.js";
import axiosInstance from "../components/api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function EmailDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/email/getEmailEvent/${id}`);
      setEvent(normalizeEvent(res.data.data));
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load event");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && id) fetchEvent();
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-sm text-muted-foreground">
        Loading event…
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-20">
        <div className="text-sm text-muted-foreground">{error || "Event not found"}</div>
        <Link to="/dashboard" className="text-sm text-primary mt-3 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  const timeline = buildTimelineFromWorkerHistory(event);
  const lastError =
    [...(event.workerHistory || [])]
      .reverse()
      .find((h) => h.errorMessage)?.errorMessage || event.errorMessage;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-base"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{event.id}</h1>
            <StatusBadge status={event.status} size="md" />
          </div>
          <div className="mt-1.5 text-sm text-muted-foreground">
            Recipient{" "}
            <span className="font-mono text-foreground">{maskEmail(event.to)}</span> ·
            Subject <span className="text-foreground">{event.subject}</span>
          </div>
        </div>
        <button
          onClick={fetchEvent}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent transition-base"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-5">Worker pickup timeline</div>
          <Timeline events={timeline} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Metadata</div>
            <Meta label="Event ID" value={event.id} mono />
            <Meta label="Campaign ID" value={event.campaignId} mono />
            <Meta label="Queue" value={event.queue} mono />
            <Meta label="Worker" value={event.worker} mono />
            <Meta label="Retries" value={<RetryCounter value={event.retries} max={event.maxRetries} />} />
            <Meta label="Timestamp" value={absoluteTime(event.timestamp)} mono />
            <Meta label="Relative" value={relativeTime(event.timestamp)} />
          </div>

          {lastError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
              <div className="text-sm font-semibold mb-2 text-destructive">Latest error</div>
              <div className="text-xs text-muted-foreground">{lastError}</div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Worker history</div>
            <div className="text-xs text-muted-foreground space-y-2 font-mono">
              {(event.workerHistory || []).map((h, i) => (
                <div key={i} className="border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="text-foreground">{h.worker}</div>
                  <div>{absoluteTime(h.timestamp)}</div>
                  {h.attempt != null && <div>attempt={h.attempt}</div>}
                  <div>status={h.status}</div>
                  {h.errorMessage && (
                    <div className="text-destructive mt-0.5">{h.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
