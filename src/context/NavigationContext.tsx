import { useLocation } from "@solidjs/router";
import { ParentProps, createContext, createSignal, useContext } from "solid-js";

type NavigationContextType = ReturnType<typeof createNavigationContext>;

export const NavigationsContext = createContext<NavigationContextType>();

export const useNavigationContext = () => useContext(NavigationsContext)!;

function createNavigationContext() {
  let location = useLocation();
  let [navigation, setNavigation] = createSignal<string[]>(
    location.pathname.split("/").filter((p) => p !== ""),
  );

  function setNavigationPath(path: string) {
    let parts = path.split("/");
    setNavigation(parts);
  }

  function pathBack() {
    let parts = navigation();
    parts.pop();
    if (parts.length === 0) {
      return undefined;
    }
    let location = "/" + parts.join("/");
    console.log("back location:", location);
    return location;
  }

  return [
    { pathBack },
    {
      setNavigationPath,
    },
  ] as const;
}

export default function NavigationProvider(props: ParentProps) {
  let context = createNavigationContext();
  return (
    <NavigationsContext.Provider value={context}>
      {props.children}
    </NavigationsContext.Provider>
  );
}
