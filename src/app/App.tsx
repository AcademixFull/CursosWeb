import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { PwaStatus } from "../components/pwa/PwaStatus";
import { PwaUpdateNotice } from "../components/pwa/PwaUpdateNotice";

export default function App() {
  return (
    <AppProviders>
      <PwaStatus />
      <PwaUpdateNotice />
      <AppRouter />
    </AppProviders>
  );
}
