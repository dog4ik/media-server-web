import { LogMessage } from "../../pages/Logs";

type Props = {
  message: LogMessage;
};
export default function LogRow(props: Props) {
  return (
    <p class="hover:bg-neutral-500 w-full p-2">
      {props.message.timestamp} {props.message.target} ({props.message.level}): {props.message.fields.message}
    </p>
  );
}
