import { IBM_Plex_Sans_Thai } from "next/font/google";
import { SeminarEventEditorView } from "@/features/seminar-planner/SeminarEventEditorView";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "แก้ไขงานสัมมนา",
};

export default async function SeminarEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className={ibmPlexSansThai.className}>
      <SeminarEventEditorView eventId={id} />
    </div>
  );
}
