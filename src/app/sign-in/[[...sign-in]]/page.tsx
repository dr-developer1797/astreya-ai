import { SignIn } from "@clerk/nextjs";
import AuthScreen from "@/shared/auth/AuthScreen";

export default function SignInPage() {
  return (
    <AuthScreen>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        forceRedirectUrl="/research"
      />
    </AuthScreen>
  );
}
