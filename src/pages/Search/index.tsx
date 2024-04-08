import { useLocation } from "@solidjs/router"

export default function SearchPage() {
  let query = useLocation().search
  console.log(query);
  return <div></div>
}
