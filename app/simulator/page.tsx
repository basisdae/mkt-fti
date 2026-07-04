import { IBM_Plex_Sans_Thai } from "next/font/google";
import { SimulatorView } from "@/features/simulator/SimulatorView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Simulator",
};

export default function SimulatorPage() {
  return (
    <div className={ibmPlexSansThai.className}>
      <SimulatorView />
    </div>
  );
}
