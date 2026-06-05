import { ErrorBoundary } from "solid-js";
import Activity from "../components/Dashboard";
import { errorBoundaryFallback } from "@/components/Error";

export default function Dashboard() {
  return (
    <>
      <ErrorBoundary fallback={errorBoundaryFallback("Failed to load activity")}>
        <Activity />
      </ErrorBoundary>
    </>
  );
}
