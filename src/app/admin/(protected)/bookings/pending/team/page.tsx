import { redirect } from "next/navigation";

export default function AdminPendingTeamBookingsPage() {
  redirect("/admin/bookings/pending?type=team");
}
