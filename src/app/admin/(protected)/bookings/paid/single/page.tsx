import { redirect } from "next/navigation";

export default function AdminPaidSingleBookingsPage() {
  redirect("/admin/bookings/paid?type=single");
}
