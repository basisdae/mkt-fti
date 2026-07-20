import { IBM_Plex_Sans_Thai } from "next/font/google";
import { MonthlyPlanView } from "@/features/monthly-plan/MonthlyPlanView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "แผนรายเดือน",
};

export default function MonthlyPlanPage() {
  return (
    <div className={ibmPlexSansThai.className}>
      <MonthlyPlanView />
    </div>
  );
}
