const WORKER_LABELS = {
  emailWorker: "Email Worker",
  dlqWorker: "DLQ Worker",
  sentEmailWorker: "Sent Email Worker",
};

const STATUS_STAGE = {
  picked_up: "processing",
  success: "success",
  failed: "failed",
};

export function normalizeEvent(e) {
  const id = e.id || e._id;
  const ts = e.timestamp ? new Date(e.timestamp) : new Date(0);
  const workerHistory = e.workerHistory || [];
  const emailWorkerAttempts = workerHistory.filter(
    (h) => h.worker === "emailWorker",
  ).length;

  return {
    ...e,
    id,
    timestamp: ts,
    status: e.status || (e.source === "dlq" ? "failed" : "pending"),
    source: e.source || "sent",
    workerHistory,
    retries: emailWorkerAttempts > 0 ? Math.max(0, emailWorkerAttempts - 1) : 0,
    maxRetries: 5,
  };
}

export function normalizeEvents(events = []) {
  return events.map(normalizeEvent);
}

export function buildTimelineFromWorkerHistory(event) {
  const history = event.workerHistory || [];

  if (!history.length) {
    const ts = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();
    return [
      {
        stage: event.source === "dlq" ? "dlq" : event.status || "pending",
        ts,
        note: "No worker pickup history recorded for this event",
        worker: null,
        errorMessage: event.errorMessage,
      },
    ];
  }

  const timeline = history.map((entry) => {
    const label = WORKER_LABELS[entry.worker] || entry.worker;
    const attemptNote =
      entry.attempt != null ? ` (attempt ${entry.attempt})` : "";
    const statusNote = entry.status ? ` — ${entry.status}` : "";
    let note = `Picked up by ${label}${attemptNote}${statusNote}`;

    if (entry.errorMessage) {
      note += ` · ${entry.errorMessage}`;
    }

    return {
      stage:
        entry.worker === "dlqWorker"
          ? "dlq"
          : STATUS_STAGE[entry.status] || "processing",
      ts: entry.timestamp,
      note,
      worker: entry.worker,
      attempt: entry.attempt,
      status: entry.status,
      errorMessage: entry.errorMessage,
    };
  });

  if (event.source === "dlq" && !history.some((h) => h.worker === "dlqWorker")) {
    timeline.push({
      stage: "dlq",
      ts: event.timestamp,
      note: event.errorMessage || "Moved to Dead Letter Queue",
      worker: "dlqWorker",
      errorMessage: event.errorMessage,
    });
  }

  return timeline;
}
