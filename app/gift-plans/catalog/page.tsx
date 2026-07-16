import { IBM_Plex_Sans_Thai } from "next/font/google";
import { GiftCatalogView } from "@/features/gift-plan/GiftCatalogView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "คลังของพรีเมียมและของแจก",
};

export default function GiftCatalogPage() {
  return (
    <div className={ibmPlexSansThai.className}>
      <GiftCatalogView />
    </div>
  );
}
