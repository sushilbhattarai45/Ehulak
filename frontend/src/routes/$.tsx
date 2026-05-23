import { createFileRoute } from "@tanstack/react-router";
import { ClientApp } from "../client-entry";

export const Route = createFileRoute("/$")({
  component: ClientApp,
});
