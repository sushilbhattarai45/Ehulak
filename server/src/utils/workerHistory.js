export function appendWorkerPickup(history = [], entry) {
  return [
    ...history,
    {
      worker: entry.worker,
      timestamp: entry.timestamp || new Date(),
      attempt: entry.attempt,
      status: entry.status || "picked_up",
      errorMessage: entry.errorMessage,
    },
  ];
}
export function finalizeLastAttempt(history,{
  status,errorMessage
}){
  if (!history?.length)
  {
    return history || [];
  }
  const last = history?.length-1;

  history[last].status = status;

  if(errorMessage)
  {
    history[last].errorMessage = errorMessage;
  }
  return history;

}