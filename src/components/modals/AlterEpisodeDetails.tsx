import { Show, createMemo, createResource, createUniqueId } from "solid-js";
import PrimeButton from "../ui/PrimeButton";
import TextInput from "../ui/TextInput";
import Modal, { ModalProps } from "./Modal";
import { alterEpisode, getEpisodeById } from "../../utils/serverApi";
import TextBox from "../ui/TextBox";
import { useNotifications } from "../../context/NotificationContext";

type Props = {
  episodeId: number;
  onEdit: () => void;
};

type FieldProps = {
  title: string;
  name: string;
  value?: string;
};

function TextBoxField(props: FieldProps) {
  let id = createUniqueId();
  return (
    <div class="flex flex-col gap-2 justify-center max-w-xl">
      <label for={id}>{props.title}</label>
      <TextBox id={id} value={props.value} name={props.name} rows={5} />
    </div>
  );
}

function InputField(props: FieldProps) {
  let id = createUniqueId();
  return (
    <div class="flex gap-2 pt-3 justify-between items-center">
      <label for={id}>{props.title}:</label>
      <TextInput
        id={id}
        placeholder={props.title}
        name={props.name}
        value={props.value}
      />
    </div>
  );
}

export default function AlterEpisodeDetailsModal(props: Props & ModalProps) {
  // NOTE: something wrong here. Aren't props reactive?
  let id = createMemo(() => props.episodeId);
  let [episode] = createResource(id, getEpisodeById);
  let notificator = useNotifications();

  async function handleSubmit(e: SubmitEvent) {
    let formData = new FormData(e.target as HTMLFormElement);
    let json: Record<string, string | number> = {};
    for (let [key, value] of formData) {
      json[key] = value.toString();
    }
    json["id"] = props.episodeId;
    await alterEpisode(json)
      .then(() => notificator("success", "Updated episode metadata"))
      .catch(() => {
        notificator("error", "Failed to update metadata");
      });
    props.onEdit();
  }

  return (
    <Modal ref={props.ref}>
      <Show when={!episode.loading}>
        <form
          method="dialog"
          onSubmit={handleSubmit}
          class="flex flex-col h-full justify-between"
        >
          <div class="pt-10">
            <InputField name="title" title="Title" value={episode()?.title} />
            <InputField
              name="releaseDate"
              title="Release Date"
              value={episode()?.release_date}
            />
            <InputField
              name="poster"
              title="Poster"
              value={episode()?.poster}
            />
            <TextBoxField name="plot" title="Plot" value={episode()?.plot} />
          </div>
          <div class="flex items-center self-end gap-2">
            <PrimeButton>Save</PrimeButton>
          </div>
        </form>
      </Show>
    </Modal>
  );
}
