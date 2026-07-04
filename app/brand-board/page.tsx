import type { Metadata } from "next";
import { BrandBoardPageView } from "@/features/brand/BrandBoardPageView";

export const metadata: Metadata = {
  title: "Brand Board",
};

export default function BrandBoardPage() {
  return <BrandBoardPageView />;
}
