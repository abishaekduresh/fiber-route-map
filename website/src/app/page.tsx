import { redirect } from "next/navigation";

/**
 * Home page — redirects to the login page.
 * This will be updated to redirect to a dashboard once authenticated.
 */
export default function Home() {
  redirect("/login");
}
