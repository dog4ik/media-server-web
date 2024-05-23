import SectionTitle from "../../components/Settings/SectionTitle";
import SectionSubTitle from "../../components/Settings/SectionSubTitle";
import { createAsync } from "@solidjs/router";
import { Schemas, revalidatePath, server } from "../../utils/serverApi";
import Variants from "../../components/Settings/VariantsList";
import { SmartSetting } from "../../components/Settings/Setting";
import { createStore } from "solid-js/store";
import { Show, createEffect, createSignal } from "solid-js";
import Table from "../../components/ContentTable";
import { useNotifications } from "../../context/NotificationContext";
import ProviderList from "../../components/Settings/ProviderList";

type Props = {
  remoteSettings: Schemas["FileConfigSchema"];
};

function compare(
  first: Schemas["FileConfigSchema"],
  second: Schemas["FileConfigSchema"],
) {
  for (let [key, firstValue] of Object.entries(first)) {
    let secondValue = second[key as keyof typeof first];
    if (secondValue === undefined) {
      return false;
    }
    if (typeof firstValue == "object" && !Array.isArray(firstValue)) continue;
    if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
      for (let el of firstValue) {
        if (!secondValue.includes(el)) {
          return false;
        }
      }
      for (let el of secondValue) {
        if (!firstValue.includes(el)) {
          return false;
        }
      }
    } else if (firstValue !== secondValue) return false;
  }
  return true;
}

function LibrarySettings(props: Props) {
  let notificator = useNotifications();
  let providers = createAsync(async () => {
    return server.GET("/api/configuration/providers");
  });
  let [settings, setSettings] = createStore<Schemas["FileConfigSchema"]>(
    window.structuredClone(props.remoteSettings),
  );
  let [isEqual, setIsEqual] = createSignal(true);

  createEffect(() => compareChanges());

  function compareChanges() {
    setIsEqual(compare(props.remoteSettings, { ...settings }));
  }

  function handleApply() {
    if (!isEqual()) {
      server
        .PUT("/api/configuration", { body: settings })
        .then((r) => {
          if (r.data) notificator("success", "Updated server configuration");
          if (r.error)
            notificator("error", "Failed to update server configuration");
        })
        .finally(async () => {
          await revalidatePath("/api/configuration/schema");
          compareChanges();
        });
    }
  }

  function handleConfigChange<T extends keyof typeof settings>(
    key: T,
    value: (typeof settings)[T],
  ) {
    setSettings(key, value);
    compareChanges();
  }

  function handleReset() {
    setSettings(window.structuredClone(props.remoteSettings));
    compareChanges();
  }

  function restoreConfiguration() {
    server
      .POST("/api/configuration/reset")
      .then((r) => {
        if (r.data) notificator("success", "Configuration is resetted");
        if (r.error) notificator("error", "Failed to reset configuration");
      })
      .finally(async () => {
        await revalidatePath("/api/configuration/schema");
        compareChanges();
      });
  }

  return (
    <div class="flex flex-col gap-8">
      <div>
        <SectionTitle name="Providers" />
        <SectionSubTitle name="Providers order" />
        <Show when={providers()?.data}>
          {(data) => <ProviderList providers={data()[0]} />}
        </Show>
      </div>
      <div>
        <SectionTitle name="Library" />
        <SectionSubTitle name="Library variants" />
        <Variants />
      </div>
      <div class="flex flex-col gap-8">
        <SmartSetting
          setting="show_folders"
          remoteSettings={props.remoteSettings}
          set={handleConfigChange}
          updatedSettings={settings}
        />
        <SmartSetting
          setting="movie_folders"
          remoteSettings={props.remoteSettings}
          set={handleConfigChange}
          updatedSettings={settings}
        />
        <SectionTitle name="Server" />
        <SmartSetting
          setting="port"
          set={handleConfigChange}
          remoteSettings={props.remoteSettings}
          updatedSettings={settings}
        />
        <SmartSetting
          setting="hw_accel"
          set={handleConfigChange}
          remoteSettings={props.remoteSettings}
          updatedSettings={settings}
        />
        <SmartSetting
          setting="ffmpeg_path"
          set={handleConfigChange}
          remoteSettings={props.remoteSettings}
          updatedSettings={settings}
        />
        <SmartSetting
          setting="ffprobe_path"
          set={handleConfigChange}
          remoteSettings={props.remoteSettings}
          updatedSettings={settings}
        />
        <SmartSetting
          setting="scan_max_concurrency"
          set={handleConfigChange}
          remoteSettings={props.remoteSettings}
          updatedSettings={settings}
        />
      </div>
      <Show when={!isEqual()}>
        <div class="fixed bottom-10 right-10 z-20 flex items-center gap-8">
          <button class="btn" onClick={handleReset}>
            Abort changes
          </button>
          <button class="btn btn-info" onClick={handleApply}>
            Apply
          </button>
        </div>
      </Show>
      <button onClick={restoreConfiguration} class="btn btn-error">
        Restore default configuration
      </button>
    </div>
  );
}

export default function LibrarySettingsPage() {
  let remoteSettings = createAsync(async () =>
    server.GET("/api/configuration/schema").then((r) => r.data!),
  );

  return (
    <Show when={remoteSettings()}>
      {(settings) => (
        <div id="settings" class="flex h-full justify-between">
          <LibrarySettings remoteSettings={settings()} />
          <Table />
        </div>
      )}
    </Show>
  );
}
