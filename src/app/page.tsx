import { redirect } from "next/navigation";

// Root redirects to login — middleware handles auth state
export default function RootPage() {
  redirect("/login");
}
