import { ErrorBoundary, Show } from "solid-js";
import { errorBoundaryFallback } from "@/components/Error";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { LanguagePicker } from "@/components/Settings/LanguagePicker";
import SettingsProvider, {
  useSettingsContext,
} from "@/context/SettingsContext";
import { Button } from "@/ui/button";
import { queryApi } from "@/utils/queryApi";
import { SETTINGS } from "@/utils/settingsDescriptors";
import SectionTitle from "../../components/Settings/SectionTitle";
import { Setting, SmartSetting } from "../../components/Settings/Setting";
import { useNotifications } from "../../context/NotificationContext";
import { server } from "../../utils/serverApi";

function GeneralSettings() {
  let notificator = useNotifications();
  let { saveStatus, remoteSettings, change, changedSettings } =
    useSettingsContext();

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
          await queryApi.invalidateQueries("get", "/api/configuration");
        });
    }
  }

  return (
    <Show when={remoteSettings.data}>
      <span
        class="pointer-events-none fixed right-10 bottom-10 text-sm text-white/40 transition-opacity duration-500"
        classList={{ "opacity-0": saveStatus() === "idle" }}
      >
        {saveStatus() === "pending" ? "Saving..." : "Saved"}
      </span>
      <div class="flex flex-col gap-8 p-5">
        <div>
          <SectionTitle name="Settings" />
          <div class="divide-y divide-neutral-500">
            <SmartSetting setting="show_folders" />
            <SmartSetting setting="movie_folders" />
            <Show when={remoteSettings.data?.metadata_language}>
              {(metadataLanguage) => (
                <Setting
                  data={SETTINGS.metadata_language}
                  remote={metadataLanguage()}
                >
                  <LanguagePicker
                    onChange={(language) =>
                      language ? change("metadata_language", language) : null
                    }
                    value={
                      changedSettings.metadata_language ??
                      metadataLanguage().config_value ??
                      metadataLanguage().default_value
                    }
                    placeholder="Select metadata language"
                  />
                </Setting>
              )}
            </Show>
            <SmartSetting setting="upnp_enabled" />
            <SmartSetting setting="hw_accel" />
            <SmartSetting setting="intro_min_duration" />
          </div>
        </div>

        <SectionTitle name="Library scan settings" />
        <div>
          <div class="divide-y divide-neutral-500">
            <SmartSetting setting="use_season_episodes" />
            <SmartSetting setting="max_show_concurrency" />
            <SmartSetting setting="max_movie_concurrency" />
            <SmartSetting setting="max_asset_concurrency" />
          </div>
        </div>
        <SectionTitle name="Advanced settings" />
        <div>
          <div class="divide-y divide-neutral-500">
            <SmartSetting setting="port" />
            <SmartSetting setting="tmdb_key" />
            <SmartSetting setting="tvdb_key" />
            <SmartSetting setting="ffmpeg_path" />
            <SmartSetting setting="intro_detection_ffmpeg_build" />
            <SmartSetting setting="ffprobe_path" />
            <SmartSetting setting="web_ui_path" />
            <SmartSetting setting="upnp_ttl" />
            <SmartSetting setting="otel_endpoint" />
          </div>
        </div>

        <Button variant={"destructive"} onClick={restoreConfiguration}>
          Restore default configuration
        </Button>
      </div>
    </Show>
  );
}

export default function GeneralSettingsPage() {
  return (
    <ErrorBoundary fallback={errorBoundaryFallback("Failed to load settings")}>
      <div id="settings" class="flex h-full justify-between">
        <SettingsProvider>
          <GeneralSettings />
        </SettingsProvider>
      </div>
    </ErrorBoundary>
  );
}
