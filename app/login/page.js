import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Log in | Stellenportal" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
