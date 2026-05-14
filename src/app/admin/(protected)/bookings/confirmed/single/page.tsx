import { redirect } from "next/navigation";

export default function AdminConfirmedSingleBookingsPage() {
  redirect("/admin/bookings/confirmed?type=single");
}
