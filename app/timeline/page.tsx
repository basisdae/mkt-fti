import { Suspense } from "react";
import { ProductTimelineView } from "@/features/timeline/ProductTimelineView";

export const metadata = {
  title: "Product Timeline",
};

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <ProductTimelineView />
    </Suspense>
  );
}
