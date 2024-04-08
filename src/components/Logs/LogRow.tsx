import { LogLevel, LogMessage } from "../../utils/serverApi";

type Props = {
  message: LogMessage;
};
function backgroundColor(level: LogLevel) {
  if (level == "TRACE") {
    return "bg-purple-900";
  }
  if (level == "DEBUG") {
    return "bg-yellow-700";
  }
  if (level == "ERROR") {
    return "bg-red-500";
  }
  if (level == "INFO") {
    return "bg-green-700";
  }
  return "bg-neutral-800";
}
export default function LogRow(props: Props) {
  let bg = backgroundColor(props.message.level);
  return (
    <p class={`${bg} w-full p-2 hover:bg-neutral-950`}>
      {props.message.timestamp} {props.message.target} ({props.message.level}):{" "}
      {props.message.fields.message ?? JSON.stringify(props.message.fields)}
    </p>
  );
}
