import type { Metadata } from "next";
import { IdeasInboxView } from "@/features/ideas/IdeasInboxView";

export const metadata: Metadata = {
  title: "Product Ideas",
};

export default function IdeasPage() {
  return <IdeasInboxView />;
}
