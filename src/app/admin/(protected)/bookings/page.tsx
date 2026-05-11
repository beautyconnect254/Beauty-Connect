import { redirect } from "next/navigation";

export default function AdminBookingsIndexPage() {
  redirect("/admin/bookings/pending/team");
}
