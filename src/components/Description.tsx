import { ShowWithDetails } from "../utils/serverApi";
import BlurImage from "./BlurImage";

type Props = {
  show: ShowWithDetails;
};

export default function Description(props: Props) {
  return (
    <div class="flex items-center w-full">
      <div class="w-52 overflow-hidden rounded-xl">
        <BlurImage
          width={208}
          height={312}
          src={props.show.poster}
          blurData={props.show.blur_data}
        />
      </div>
      <div class="h-full p-8">
        <div class="text-2xl">{props.show.title}</div>
        <div class="pt-8 max-w-2xl">{props.show.plot}</div>
      </div>
    </div>
  );
}
