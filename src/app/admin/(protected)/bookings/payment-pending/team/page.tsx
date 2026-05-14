import { redirect } from "next/navigation";

export default function AdminPaymentPendingTeamBookingsPage() {
  redirect("/admin/bookings/confirmed?type=team");
}
