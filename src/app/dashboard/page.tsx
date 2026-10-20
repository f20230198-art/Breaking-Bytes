import { Overview } from "./View";

// signed-in, data-driven and client-rendered: nothing here can be prerendered for instant navigation, so the
// dev-time check is switched off rather than flagging every page (navigation is still client-side and quick)
export const instant = false;

export default function Page() {
  return <Overview />;
}
