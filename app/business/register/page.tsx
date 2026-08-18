import { redirect } from "next/navigation";

/** Business signup is now the shared /register page with the Business switch. */
export default function BusinessRegisterRedirect() {
  redirect("/register?as=business");
}
