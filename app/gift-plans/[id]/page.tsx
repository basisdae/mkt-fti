import { IBM_Plex_Sans_Thai } from "next/font/google";
import { GiftPlanDetailView } from "@/features/gift-plan/GiftPlanDetailView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Gift Plan",
};

export default async function GiftPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className={ibmPlexSansThai.className}>
      <GiftPlanDetailView planId={id} />
    </div>
  );
}
