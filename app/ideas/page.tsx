import type { Metadata } from "next";
import { IdeasInboxView } from "@/features/ideas/IdeasInboxView";

export const metadata: Metadata = {
  title: "Ideas | MKT-FTI",
};

export default function IdeasPage() {
  return <IdeasInboxView />;
}
