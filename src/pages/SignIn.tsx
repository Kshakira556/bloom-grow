// pages/SignIn.tsx
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthForm, AuthField } from "@/components/auth/AuthForm";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SignInPng from "@/assets/images/sign-in-page.png";
import { requiresPaywall } from "@/lib/billing";
import { acceptPlanInvite } from "@/lib/api";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id")?.trim() ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const loggedInUser = await login(email, password);

      if (!loggedInUser) {
        setError("Invalid email or password");
        return;
      }

      if (inviteId && loggedInUser.role === "parent") {
        try {
          await acceptPlanInvite(inviteId);
          navigate("/visits", { replace: true });
          return;
        } catch (inviteError) {
          console.error("Invite acceptance failed after sign-in:", inviteError);
          setError("Signed in, but invite acceptance failed. Please retry from the invite link.");
          return;
        }
      }

      if (requiresPaywall(loggedInUser)) {
        navigate("/paywall", { replace: true });
        return;
      }

      if (loggedInUser.role === "admin") {
        navigate("/admin/system", { replace: true });
      } else if (loggedInUser.role === "mediator") {
        navigate("/admin/moderator", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || "Login failed");
    }
  };

  const fields: AuthField[] = [
    { name: "email", type: "email", placeholder: "Email ID", icon: <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />, value: email, onChange: (e) => setEmail(e.target.value) },
    { name: "password", type: "password", placeholder: "Password", icon: <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />, value: password, onChange: (e) => setPassword(e.target.value) },
  ];

  return (
    <AuthPage title="Sign In" illustration={SignInPng}>
      <AuthForm
        fields={fields}
        onSubmit={handleLogin}
        buttonLabel="Sign In"
        showRemember
        showForgotPassword
        error={error}
      />
      {inviteId && (
        <div className="mt-4 text-sm text-center">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate(`/register?invite_id=${encodeURIComponent(inviteId)}`)}
          >
            Don't have a password yet? Register with this invite
          </button>
        </div>
      )}
    </AuthPage>
  );
}
