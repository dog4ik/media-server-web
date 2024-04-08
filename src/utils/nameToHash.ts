export default function nameToHash(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}
