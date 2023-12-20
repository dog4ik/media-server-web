import PrimeButton from "../components/ui/PrimeButton";
import { clearDatabase } from "../utils/serverApi";

export default function Settings() {
  return (
    <div class="flex flex-col gap-5 items-start">
      <PrimeButton onClick={clearDatabase}>Clear database</PrimeButton>
    </div>
  );
}
