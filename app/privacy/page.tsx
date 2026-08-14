import { redirect } from "next/navigation";

/** Old /privacy URL — content lives on /terms only. */
export default function PrivacyRedirectPage() {
  redirect("/terms");
}
