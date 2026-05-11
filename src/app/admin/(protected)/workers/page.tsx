import { redirect } from "next/navigation";

export default function AdminWorkersIndexPage() {
  redirect("/admin/workers/active");
}
