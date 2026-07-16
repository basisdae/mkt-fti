import { IBM_Plex_Sans_Thai } from "next/font/google";
import { SeminarLibraryView } from "@/features/seminar-planner/SeminarLibraryView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "คลังเซสชัน — Seminar Planner",
};

export default function SeminarLibraryPage() {
  return (
    <div className={ibmPlexSansThai.className}>
      <SeminarLibraryView />
    </div>
  );
}
