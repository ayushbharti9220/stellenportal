import { Suspense } from "react";
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "Sign up | Stellenportal" };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
