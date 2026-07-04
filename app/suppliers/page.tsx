import type { Metadata } from "next";
import { SuppliersListView } from "@/features/suppliers/SuppliersListView";

export const metadata: Metadata = {
  title: "Suppliers",
};

export default function SuppliersPage() {
  return <SuppliersListView />;
}
