import { IBM_Plex_Sans_Thai } from "next/font/google";
import { SeminarPlannerHomeView } from "@/features/seminar-planner/SeminarPlannerHomeView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Seminar Planner",
};

export default function SeminarsPage() {
  return (
    <div className={ibmPlexSansThai.className}>
      <SeminarPlannerHomeView />
    </div>
  );
}
