import { Schemas, server } from "@/utils/serverApi";
import { ParentProps, createContext, createSignal, onCleanup, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { useNotifications } from "./NotificationContext";
import { queryApi, queryClient } from "@/utils/queryApi";

export type SettingsObject = {
  [K in Schemas["ConfigSchema"][number]["key"]]: Extract<
    Schemas["ConfigSchema"][number],
    { key: K }
  >;
};

export type SettingsValuesObject = {
  [K in keyof SettingsObject]: SettingsObject[K]["default_value"] | null;
};

type SettingsContextType = ReturnType<typeof createSettingsContext>;

export const SettingsContext = createContext<SettingsContextType>();

export const useSettingsContext = () => useContext(SettingsContext)!;

function cmp(lhs: any, rhs: any) {
  if (Array.isArray(lhs) && Array.isArray(rhs)) {
    if (lhs.length !== rhs.length) return false;
    for (let i = 0; i < lhs.length; ++i) {
      if (lhs[i] !== rhs[i]) return false;
    }
    return true;
  }
  return lhs === rhs;
}

function createSettingsContext() {
  let notificator = useNotifications();
  let [changedSettings, setChangedSettings] = createStore<Partial<SettingsValuesObject>>({});
  let [saveStatus, setSaveStatus] = createSignal<"idle" | "pending" | "saved">("idle");

  let remoteSettings = queryApi.useQuery(
    "get",
    "/api/configuration",
    () => ({}),
    () => ({
      select: (data) =>
        data.reduce((obj, setting) => {
          // @ts-expect-error
          obj[setting.key] = setting;
          return obj;
        }, {} as SettingsObject),
    }),
  );

  // Values sent to the server but not yet visible in remoteSettings.data.
  // Used as the comparison baseline in change() so that toggling during
  // revalidation doesn't compare against stale cache data.
  let pendingCommit: Partial<SettingsValuesObject> = {};

  function effectiveConfigValue(key: keyof SettingsObject) {
    return key in pendingCommit
      ? pendingCommit[key as keyof typeof pendingCommit]
      : remoteSettings.data![key].config_value;
  }

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(saveTimer));

  async function save() {
    let snapshot = { ...changedSettings } as Partial<SettingsValuesObject>;
    if (Object.keys(snapshot).length === 0) return;

    setSaveStatus("pending");
    let r = await server.PATCH("/api/configuration", { body: snapshot });

    if (r.data?.require_restart) {
      notificator("Restart is required for some settings to apply");
    }
    if (r.error) {
      notificator("Failed to update server configuration");
    } else {
      // Server accepted the values - track them so change() compares correctly
      // while the query is still revalidating.
      Object.assign(pendingCommit, snapshot);
    }

    await queryClient.invalidateQueries({
      queryKey: ["get", "/api/configuration"],
    });

    // Fresh data is in — clear pending tracking for this batch.
    for (let key of Object.keys(snapshot)) {
      delete pendingCommit[key as keyof typeof pendingCommit];
    }
    // Only clear changedSettings entries that haven't been modified since the
    // snapshot was taken. If the user changed a key again during the save,
    // its current value will differ from the snapshot and we leave it alone
    // so the next debounced save picks it up.
    setChangedSettings(
      produce((s) => {
        for (let [key, snapshotValue] of Object.entries(snapshot)) {
          let k = key as keyof typeof s;
          if (cmp(s[k], snapshotValue)) {
            delete s[k];
          }
        }
      }),
    );

    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function change<T extends keyof typeof changedSettings>(
    key: T,
    value: (typeof changedSettings)[T],
  ) {
    let configValue = effectiveConfigValue(key);
    let defaultValue = remoteSettings.data![key].default_value;

    if (value === null && configValue !== null) {
      setChangedSettings(key, null);
    } else if (cmp(configValue, value)) {
      setChangedSettings(
        produce((s) => {
          delete s[key];
        }),
      );
    } else if (configValue === null && cmp(defaultValue, value)) {
      setChangedSettings(
        produce((s) => {
          delete s[key];
        }),
      );
    } else {
      setChangedSettings(key, value);
    }

    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 600);
  }

  return {
    saveStatus,
    change,
    changedSettings,
    remoteSettings,
  } as const;
}

export default function SettingsProvider(props: ParentProps) {
  let context = createSettingsContext();
  return <SettingsContext.Provider value={context}>{props.children}</SettingsContext.Provider>;
}
