import { redirect } from "next/navigation";

export default function AdminPaymentPendingSingleBookingsPage() {
  redirect("/admin/bookings/confirmed?type=single");
}
