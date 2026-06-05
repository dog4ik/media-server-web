import { Schemas } from "@/utils/serverApi";
import { formatSize } from "@/utils/formats";
import { createMemo, createSignal, JSX, Show } from "solid-js";
import Copy from "lucide-solid/icons/copy";
import Check from "lucide-solid/icons/check";
import { Button } from "@/ui/button";
import tracing from "@/utils/tracing";

type Props = {
  torrent: Schemas["TorrentState"];
};

type CellProps = {
  label: string;
  class?: string;
  children: JSX.Element;
};

function InfoCell(props: CellProps) {
  return (
    <div
      class="flex flex-col justify-center gap-0.5 px-2 py-1"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <span class="text-muted-foreground text-[10px] tracking-wide uppercase">{props.label}</span>
      <div class="min-w-0 text-sm font-medium">{props.children}</div>
    </div>
  );
}

type CopyButtonProps = {
  value: string;
  label: string;
};

function CopyButton(props: CopyButtonProps) {
  let [copied, setCopied] = createSignal(false);
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    await navigator.clipboard
      .writeText(props.value)
      .then(() => {
        setCopied(true);
        clearTimeout(copiedTimeout);
        copiedTimeout = setTimeout(() => setCopied(false), 750);
      })
      .catch(() => {
        // NotAllowedError DOMException
        // Thrown if writing to the clipboard is not allowed
        tracing.error("Writing to the clipboard is not allowed");
      });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      title={copied() ? "Copied!" : props.label}
      onClick={copy}
      class="hover:bg-secondary shrink-0"
    >
      <Show when={copied()} fallback={<Copy class="text-secondary-foreground size-3.5" />}>
        <Check class="text-primary size-3.5" />
      </Show>
    </Button>
  );
}

export function TorrentInfo(props: Props) {
  let downloadedPieces = createMemo(() => props.torrent.downloaded_pieces.filter(Boolean).length);
  let downloadedSize = createMemo(() => {
    let { total_pieces, total_size } = props.torrent;
    if (total_pieces === 0) return 0;
    return (total_size / total_pieces) * downloadedPieces();
  });

  return (
    <div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <InfoCell label="Name" class="col-span-2 lg:col-span-4">
        <span class="break-all">{props.torrent.name}</span>
      </InfoCell>
      <InfoCell label="Info hash (hex)" class="col-span-2 lg:col-span-3">
        <div class="flex items-center gap-1.5">
          <code class="min-w-0 text-sm break-all">{props.torrent.info_hash}</code>
          <CopyButton value={props.torrent.info_hash} label="Copy info hash" />
        </div>
      </InfoCell>
      <InfoCell label="State">
        <span class="capitalize">
          {props.torrent.state.type}
          <Show when={props.torrent.state.type === "error" && props.torrent.state}>
            {(state) => ` (${JSON.stringify(state().error)})`}
          </Show>
        </span>
      </InfoCell>
      <InfoCell label="Progress">{props.torrent.percent.toFixed(2)}%</InfoCell>
      <InfoCell label="Downloaded">
        {formatSize(downloadedSize())} / {formatSize(props.torrent.total_size)}
      </InfoCell>
      <InfoCell label="Pieces">
        {downloadedPieces()} / {props.torrent.total_pieces}
      </InfoCell>
      <InfoCell label="Pending pieces">{props.torrent.pending_pieces.length}</InfoCell>
      <InfoCell label="Download speed">{formatSize(props.torrent.download_speed)}/s</InfoCell>
      <InfoCell label="Upload speed">{formatSize(props.torrent.upload_speed)}/s</InfoCell>
      <InfoCell label="Peers">{props.torrent.peers.length}</InfoCell>
      <InfoCell label="Trackers">{props.torrent.trackers.length}</InfoCell>
    </div>
  );
}
