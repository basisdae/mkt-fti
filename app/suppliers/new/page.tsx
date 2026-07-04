import type { Metadata } from "next";
import { AddSupplierForm } from "@/features/suppliers/AddSupplierForm";

export const metadata: Metadata = {
  title: "New Supplier",
};

export default function NewSupplierPage() {
  return <AddSupplierForm />;
}
