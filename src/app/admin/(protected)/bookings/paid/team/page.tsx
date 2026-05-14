import { redirect } from "next/navigation";

export default function AdminPaidTeamBookingsPage() {
  redirect("/admin/bookings/paid?type=team");
}
