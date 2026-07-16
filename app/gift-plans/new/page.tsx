import { redirect } from "next/navigation";

export const metadata = {
  title: "New Gift Plan",
};

export default function NewGiftPlanPage() {
  redirect("/gift-plans");
}
