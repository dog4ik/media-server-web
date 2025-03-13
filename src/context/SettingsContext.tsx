import { revalidatePath, Schemas, server } from "@/utils/serverApi";
import { ParentProps, createContext, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { useNotifications } from "./NotificationContext";
import { createAsync } from "@solidjs/router";

export type SettingsErrorObject = {
  [K in Schemas["ConfigurationApplyError"]["key"]]: Extract<
    Schemas["ConfigurationApplyError"],
    { key: K }
  >;
};

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
      let leftEl = lhs[i];
      let rightEl = rhs[i];
      if (leftEl !== rightEl) {
        return false;
      }
    }
    return true;
  }
  return lhs === rhs;
}

function createSettingsContext(initialSettings: SettingsObject) {
  let notificator = useNotifications();
  let [changedSettings, setChangedSettings] = createStore<
    Partial<SettingsValuesObject>
  >({});
  let [settingsErrors, setSettingsErrors] = createStore<SettingsErrorObject>(
    {},
  );

  let remoteSettings = createAsync(
    async (prev) => {
      let settings = await server.GET("/api/configuration").then((r) => r.data);
      if (settings === undefined) return prev;

      return settings.reduce((obj, setting) => {
        // @ts-expect-error
        obj[setting.key] = setting;
        return obj;
      }, {} as SettingsObject);
    },
    { initialValue: initialSettings },
  );

  function apply() {
    resetSettingsErrors();
    server
      .PATCH("/api/configuration", { body: changedSettings })
      .then((r) => {
        if (r.data) {
          for (let e of r.data.errors) {
            setSettingsErrors(e.key, e);
          }
          if (r.data.require_restart) {
            notificator("Restart is required for some settings to apply");
          } else {
            notificator("Updated server configuration");
          }
        }
        if (r.error) notificator("Failed to update server configuration");
      })
      .finally(async () => {
        await revalidatePath("/api/configuration");
        resetChangedSettings();
      });
  }

  function change<T extends keyof typeof changedSettings>(
    key: T,
    value: (typeof changedSettings)[T],
  ) {
    let configValue = remoteSettings()[key].config_value;
    let defaultValue = remoteSettings()[key].default_value;

    if (value === null && configValue !== null) {
      setChangedSettings(key, null);
      return;
    }
    if (cmp(configValue, value)) {
      setChangedSettings(
        produce((settings) => {
          delete settings[key];
        }),
      );
      return;
    }
    if (configValue === null && cmp(defaultValue, value)) {
      setChangedSettings(
        produce((settings) => {
          delete settings[key];
        }),
      );
      return;
    }
    setChangedSettings(key, value);
  }

  function resetChangedSettings() {
    setChangedSettings(
      produce((settings) => {
        for (let key of Object.keys(settings)) {
          delete settings[key as keyof typeof settings];
        }
      }),
    );
  }

  function resetSettingsErrors() {
    setSettingsErrors({});
  }

  return {
    setSettingsErrors,
    setChangedSettings,
    resetSettingsErrors,
    resetChangedSettings,
    apply,
    change,
    changedSettings,
    settingsErrors,
    remoteSettings,
  } as const;
}

type SettingsProviderProps = {
  initialSettings: SettingsObject;
} & ParentProps;

export default function SettingsProvider(props: SettingsProviderProps) {
  let context = createSettingsContext(props.initialSettings);
  return (
    <SettingsContext.Provider value={context}>
      {props.children}
    </SettingsContext.Provider>
  );
}
