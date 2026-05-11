import { redirect } from "next/navigation";

export default function AdminTeamRequestsRedirectPage() {
  redirect("/admin/bookings/pending/team");
}
