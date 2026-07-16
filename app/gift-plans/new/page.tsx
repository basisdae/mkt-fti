import { redirect } from "next/navigation";

export const metadata = {
  title: "สร้างแผนของขวัญใหม่",
};

export default function NewGiftPlanPage() {
  redirect("/gift-plans");
}
