import {
  For,
  ParentProps,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import { Media, posterList } from "@/utils/library";
import Notification, { NotificationProps } from "../components/Notification";

type NotificationsContextType = ReturnType<typeof createNotificationsContext>;

type NotificationType = NotificationProps & { id: string };

export const NotificationsContext = createContext<NotificationsContextType>();

export const useNotificationsContext = () => useContext(NotificationsContext)!;

export function useNotifications() {
  let [_, { addSimpleNotification }] = useNotificationsContext();
  return (message: string) => addSimpleNotification(message);
}

export function useRawNotifications() {
  let [_, { addNotification }] = useNotificationsContext();
  return (props: NotificationProps) => addNotification(props);
}

export function useMediaNotifications() {
  let [_, { addNotification }] = useNotificationsContext();
  return (media: Media, message: string) => {
    let props = {
      poster: posterList(media).at(0),
      subTitle: media.friendlyTitle(),
      message: message,
      contentUrl: media.url(),
    };
    addNotification(props);
  };
}

function createNotificationsContext() {
  let [notifications, setNotifications] = createSignal<NotificationType[]>([]);

  function removeNotification(id: string) {
    setNotifications(notifications().filter((x) => x.id !== id));
  }

  function addSimpleNotification(message: string) {
    let newNotification: NotificationType = {
      message,
      id: crypto.randomUUID(),
    };
    setNotifications([...notifications(), newNotification]);
  }

  function addNotification(props: NotificationProps) {
    let newNotification: NotificationType = {
      ...props,
      id: crypto.randomUUID(),
    };
    setNotifications([...notifications(), newNotification]);
  }

  return [
    { notifications },
    {
      setNotifications,
      removeNotification,
      addSimpleNotification,
      addNotification,
    },
  ] as const;
}

export default function NotificationsProvider(props: ParentProps) {
  let context = createNotificationsContext();
  let [{ notifications }, { removeNotification }] = context;
  return (
    <NotificationsContext.Provider value={context}>
      <div class="fixed bottom-2 right-2 z-50 flex max-w-xs select-none flex-col items-end gap-3 md:max-w-2xl">
        <For each={notifications()}>
          {(item) => (
            <Notification
              onClose={() => removeNotification(item.id)}
              message={item.message}
              poster={item.poster}
              contentUrl={item.contentUrl}
              subTitle={item.subTitle}
              onUndo={item.onUndo}
              duration={item.duration}
            />
          )}
        </For>
      </div>
      {props.children}
    </NotificationsContext.Provider>
  );
}
