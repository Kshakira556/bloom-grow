// pages/Register.tsx
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthForm, AuthField } from "@/components/auth/AuthForm";
import { User, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RegisterPng from "@/assets/images/Register page.jpeg";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const user = await register({ full_name: fullName, email, password });

      if (user.role === "admin") navigate("/admin/system", { replace: true });
      else if (user.role === "mediator") navigate("/admin/moderator", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    }
  };

  const fields: AuthField[] = [
    { name: "fullName", type: "text", placeholder: "Full Name", icon: <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />, value: fullName, onChange: (e) => setFullName(e.target.value) },
    { name: "email", type: "email", placeholder: "Email ID", icon: <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />, value: email, onChange: (e) => setEmail(e.target.value) },
    { name: "password", type: "password", placeholder: "Password", icon: <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />, value: password, onChange: (e) => setPassword(e.target.value) },
  ];

  return (
    <AuthPage title="Register" illustration={RegisterPng}>
      <AuthForm fields={fields} onSubmit={handleRegister} buttonLabel="Register" error={error} />
    </AuthPage>
  );
}
