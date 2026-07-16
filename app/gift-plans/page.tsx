import { IBM_Plex_Sans_Thai } from "next/font/google";
import { GiftPlansHomeView } from "@/features/gift-plan/GiftPlansHomeView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Gift Plans",
};

export default function GiftPlansPage() {
  return (
    <div className={ibmPlexSansThai.className}>
      <GiftPlansHomeView />
    </div>
  );
}
