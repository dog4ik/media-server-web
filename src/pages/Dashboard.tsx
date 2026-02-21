import { ErrorBoundary } from "solid-js";
import Activity from "../components/Dashboard";

export default function Dashboard() {
  return (
    <>
      <ErrorBoundary fallback={"hello"}>
        <Activity />
      </ErrorBoundary>
    </>
  );
}
