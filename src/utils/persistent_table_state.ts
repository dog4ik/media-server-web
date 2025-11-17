import { VisibilityState } from "@tanstack/solid-table";
import tracing from "./tracing";

export class PersistentTableState {
  constructor(private key: string) {}
  private storageKey() {
    return `${this.key}_table_visibility`;
  }

  saveVisibilyState(visibilityState: VisibilityState) {
    let visibleKeys = Object.entries(visibilityState)
      .filter(([_, v]) => !v)
      .map(([key]) => key);
    tracing.debug(
      { key: this.storageKey(), visibility: visibleKeys },
      "Saving column visibily to local storage",
    );
    localStorage.setItem(this.storageKey(), JSON.stringify(visibleKeys));
  }

  loadVisibilityState(): VisibilityState | undefined {
    try {
      let json = JSON.parse(localStorage.getItem(this.storageKey()) ?? "");
      if (Array.isArray(json)) {
        let out: VisibilityState = {};
        for (let value of json) {
          if (typeof value == "string") {
            out[value] = false;
          }
        }
        tracing.debug(
          { key: this.storageKey(), out },
          "Loaded persistant storage visibility",
        );
        return out;
      }
    } catch {}
    tracing.debug(
      { key: this.storageKey() },
      "Persintant storage vibility was not loaded",
    );
  }
}
