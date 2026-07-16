import { redirect } from "next/navigation";

export const metadata = {
  title: "สร้างงานสัมมนาใหม่",
};

export default function NewSeminarPage() {
  redirect("/seminars");
}
