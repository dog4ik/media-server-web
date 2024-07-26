import { createSignal, Show } from "solid-js";
import Notification from "../components/Notification";
import { useNotifications } from "../context/NotificationContext";

export default function TestPage() {
  let [show, setShow] = createSignal(true);
  let notificator = useNotifications();
  function emitNotification() {
    notificator("Whatever text and numbers 13089");
  }
  return (
    <div>
      <Show when={show()}>
        <Notification
          onClose={() => {
            console.log("Closed notification");
            setShow(false);
          }}
          poster="http://localhost:6969/api/show/198/poster"
          message="Finished transcoding"
          subTitle="Witcher S01E02"
          contentUrl="https://google.com"
          onUndo={() => console.log("cancelled")}
        />
      </Show>
      <button onClick={emitNotification} class="btn">Test</button>
    </div>
  );
}
