import { IBM_Plex_Sans_Thai } from "next/font/google";
import { MonthlyPlanWorkDetailView } from "@/features/monthly-plan/MonthlyPlanWorkDetailView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "รายละเอียดงาน — แผนรายเดือน",
};

export default async function MonthlyPlanWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className={ibmPlexSansThai.className}>
      <MonthlyPlanWorkDetailView workId={id} />
    </div>
  );
}
