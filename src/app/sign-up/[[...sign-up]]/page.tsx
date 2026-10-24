import { SignUp } from "@clerk/nextjs";
import AuthScreen from "@/shared/auth/AuthScreen";

export default function SignUpPage() {
  return (
    <AuthScreen>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/research"
      />
    </AuthScreen>
  );
}
