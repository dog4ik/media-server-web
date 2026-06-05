import SectionTitle from "../../components/Settings/SectionTitle";
import { server } from "../../utils/serverApi";
import { queryApi, queryClient } from "@/utils/queryApi";
import { Setting, SmartSetting } from "../../components/Settings/Setting";
import { ErrorBoundary, Show } from "solid-js";
import { useNotifications } from "../../context/NotificationContext";
import SettingsProvider, { useSettingsContext } from "@/context/SettingsContext";
import promptConfirm from "@/components/modals/ConfirmationModal";
import { Button } from "@/ui/button";
import { SETTINGS } from "@/utils/settingsDescriptors";
import { LanguagePicker } from "@/components/Settings/LanguagePicker";
import { errorBoundaryFallback } from "@/components/Error";

function GeneralSettings() {
  let notificator = useNotifications();
  let { saveStatus, remoteSettings, change, changedSettings } = useSettingsContext();

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
          await queryApi.invalidateQueries(queryClient, "get", "/api/configuration");
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
            <Setting
              data={SETTINGS["metadata_language"]}
              remote={remoteSettings.data!["metadata_language"]}
            >
              <LanguagePicker
                onChange={(language) => (language ? change("metadata_language", language) : null)}
                value={
                  changedSettings["metadata_language"] ??
                  remoteSettings.data!["metadata_language"].config_value ??
                  remoteSettings.data!["metadata_language"].default_value
                }
                placeholder="Select metadata language"
              />
            </Setting>
            <SmartSetting setting="upnp_enabled" />
            <SmartSetting setting="hw_accel" />
            <SmartSetting setting="intro_min_duration" />
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
