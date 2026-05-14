import { redirect } from "next/navigation";

export default function AdminConfirmedTeamBookingsPage() {
  redirect("/admin/bookings/confirmed?type=team");
}
