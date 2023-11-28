import {
  For,
  ParentProps,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import Notififcation, { NotificationType } from "../components/Notification";

type NotificationsContextType = ReturnType<typeof createNotificationsContext>;

export const NotificationsContext = createContext<NotificationsContextType>();

export const useNotificationsContext = () => useContext(NotificationsContext)!;

export function useNotifications() {
  let [, { addNotification }] = useNotificationsContext();
  return (type: NotificationType["type"], message: string) =>
    addNotification(type, message);
}

function createNotificationsContext() {
  let [notifications, setNotifications] = createSignal<NotificationType[]>([]);

  function removeNotification(id: string) {
    setNotifications(notifications().filter((n) => n.id !== id));
  }

  function addNotification(type: NotificationType["type"], message: string) {
    let newNotification: NotificationType = {
      id: crypto.randomUUID(),
      type,
      message,
    };
    setNotifications([...notifications(), newNotification]);
  }

  return [
    { notifications },
    { setNotifications, removeNotification, addNotification },
  ] as const;
}

export default function NotificationsProvider(props: ParentProps) {
  let context = createNotificationsContext();
  let [{ notifications }, { removeNotification }] = context;
  return (
    <NotificationsContext.Provider value={context}>
      <div class="fixed right-2 top-2 z-50 flex max-w-xs select-none flex-col items-end gap-3 md:max-w-2xl">
        <For each={notifications()}>
          {(item) => (
            <Notififcation
              onClose={() => removeNotification(item.id)}
              type={item.type}
              message={item.message}
              id={item.id}
            />
          )}
        </For>
      </div>
      {props.children}
    </NotificationsContext.Provider>
  );
}
