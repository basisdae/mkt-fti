import type { Metadata } from "next";
import { SuppliersListView } from "@/features/suppliers/SuppliersListView";

export const metadata: Metadata = {
  title: "Suppliers | MKT-FTI",
};

export default function SuppliersPage() {
  return <SuppliersListView />;
}
