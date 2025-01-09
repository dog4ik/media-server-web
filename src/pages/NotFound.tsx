import { Button } from "@/ui/button";

export default function NotFound() {
  function goBack() {
    window.navigation.back();
  }
  return (
    <div class="flex h-full w-full items-center justify-center gap-2">
      <div>Page is not found</div>
      <Button onClick={goBack}>Go back</Button>
    </div>
  );
}
