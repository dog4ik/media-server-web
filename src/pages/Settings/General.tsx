import SectionTitle from "../../components/Settings/SectionTitle";
import SectionSubTitle from "../../components/Settings/SectionSubTitle";
import { createAsync } from "@solidjs/router";
import { Schemas, revalidatePath, server } from "../../utils/serverApi";
import Variants from "../../components/Settings/VariantsList";
import { SmartSetting } from "../../components/Settings/Setting";
import { Show } from "solid-js";
import { useNotifications } from "../../context/NotificationContext";
// import ProviderList from "../../components/Settings/ProviderList";
import SettingsProvider, {
  useSettingsContext,
} from "@/context/SettingsContext";
import promptConfirm from "@/components/modals/ConfirmationModal";

export type SettingsObject = {
  [K in Schemas["UtoipaConfigSchema"][number]["key"]]: Extract<
    Schemas["UtoipaConfigSchema"][number],
    { key: K }
  >;
};

function GeneralSettings() {
  let notificator = useNotifications();

  let { changedSettings, resetChangedSettings, apply } = useSettingsContext();

  let changesAmount = () => Object.keys(changedSettings).length;

  function handleReset() {
    resetChangedSettings();
  }

  async function restoreConfiguration() {
    let confirmed = await promptConfirm("Do you want to reset configuration?");
    if (confirmed) {
      await server
        .POST("/api/configuration/reset")
        .then((r) => {
          if (r.data) notificator("Restored default configuration");
          if (r.error) notificator("Failed to reset configuration");
        })
        .finally(async () => {
          await revalidatePath("/api/configuration");
        });
    }
  }

  return (
    <div class="flex flex-col gap-8 divide-y p-5">
      {/*
      <div>
        <SectionTitle name="Providers" />
        <SectionSubTitle name="Providers order" />
        <Show when={providers()?.data}>
          {(data) => <ProviderList providers={data()[0]} />}
        </Show>
      </div>
      */}
      <div>
        <SectionTitle name="Library" />
        <SectionSubTitle name="Transcoded variants" />
        <Variants />
      </div>
      <div>
        <SectionTitle name="Server" />
        <div class="divide-y divide-neutral-500">
          <SmartSetting setting="show_folders" />
          <SmartSetting setting="movie_folders" />
          <SmartSetting setting="port" />
          <SmartSetting setting="hw_accel" />
          <SmartSetting setting="ffmpeg_path" />
          <SmartSetting setting="ffprobe_path" />
          <SmartSetting setting="web_ui_path" />
        </div>
      </div>

      <div>
        <SectionTitle name="Secrets" />
        <div class="divide-y divide-neutral-500">
          <SmartSetting setting="tmdb_key" />
          <SmartSetting setting="tvdb_key" />
        </div>
      </div>

      <div>
        <SectionTitle name="Intro detection" />
        <div class="divide-y divide-neutral-500">
          <SmartSetting setting="intro_min_duration" />
          <SmartSetting setting="intro_detection_ffmpeg_build" />
        </div>
      </div>
      <Show when={changesAmount()}>
        {(amount) => (
          <div class="fixed bottom-10 right-10 z-20 flex items-center gap-8">
            <button class="btn" onClick={handleReset}>
              Abort changes
            </button>
            <button class="btn btn-info" onClick={apply}>
              Apply {amount()} {amount() === 1 ? "change" : "changes"}
            </button>
          </div>
        )}
      </Show>
      <button onClick={restoreConfiguration} class="btn btn-error">
        Restore default configuration
      </button>
    </div>
  );
}

export default function GeneralSettingsPage() {
  let remoteSettings = createAsync(async () => {
    let settings = await server
      .GET_NO_CACHE("/api/configuration")
      .then((r) => r.data);
    if (settings === undefined) return;

    return settings.reduce((obj, setting) => {
      // @ts-expect-error
      obj[setting.key] = setting;
      return obj;
    }, {} as SettingsObject);
  });

  return (
    <Show when={remoteSettings()}>
      {(settings) => (
        <div id="settings" class="flex h-full justify-between">
          <SettingsProvider initialSettings={settings()}>
            <GeneralSettings />
          </SettingsProvider>
        </div>
      )}
    </Show>
  );
}
