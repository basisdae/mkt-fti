import { Suspense } from "react";
import { ProductNotesView } from "@/features/notes/ProductNotesView";

export const metadata = {
  title: "Notes",
};

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <ProductNotesView />
    </Suspense>
  );
}
