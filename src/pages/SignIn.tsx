// pages/SignIn.tsx
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthForm, AuthField } from "@/components/auth/AuthForm";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SignInPng from "@/assets/images/Sign in page.png";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.role === "admin") navigate("/admin/system", { replace: true });
      else if (loggedInUser.role === "mediator") navigate("/admin/moderator", { replace: true });
      else navigate("/dashboard", { replace: true });
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
    </AuthPage>
  );
}
