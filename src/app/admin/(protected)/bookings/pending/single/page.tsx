import { redirect } from "next/navigation";

export default function AdminPendingSingleBookingsPage() {
  redirect("/admin/bookings/pending?type=single");
}
