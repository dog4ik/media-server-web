import { ErrorBoundary } from "solid-js";
import { errorBoundaryFallback } from "@/components/Error";
import Activity from "../components/Dashboard";

export default function Dashboard() {
  return (
    <ErrorBoundary fallback={errorBoundaryFallback("Failed to load activity")}>
      <Activity />
    </ErrorBoundary>
  );
}
