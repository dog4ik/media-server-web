type Props = {
  downloading: number;
  seeding: number;
};

export default function StatusHeader(props: Props) {
  return (
    <div class="flex items-center">
      <span>Torrents: {props.downloading + props.seeding}</span>
    </div>
  );
}
