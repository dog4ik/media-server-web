export default function NotFound() {
  function goBack() {
    window.navigation.back();
  }
  return (
    <div class="flex h-full w-full items-center justify-center gap-2">
      <div>Page is not found</div>
      <button class="btn" onClick={goBack}>Go back</button>
    </div>
  );
}
