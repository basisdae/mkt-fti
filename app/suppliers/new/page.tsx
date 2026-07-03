import type { Metadata } from "next";
import { AddSupplierForm } from "@/features/suppliers/AddSupplierForm";

export const metadata: Metadata = {
  title: "Register Supplier | MKT-FTI",
};

export default function NewSupplierPage() {
  return <AddSupplierForm />;
}
