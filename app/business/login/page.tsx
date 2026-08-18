import { redirect } from "next/navigation";

/** Business login is now the shared /login page. */
export default function BusinessLoginRedirect() {
  redirect("/login");
}
