// pages/Register.tsx
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthForm, AuthField } from "@/components/auth/AuthForm";
import { User, Mail, Lock, Shield, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RegisterPng from "@/assets/images/register-page.jpeg"

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [role, setRole] = useState<"parent" | "mediator" | "admin">("parent");
const [phone, setPhone] = useState("");
const [error, setError] = useState("");
const [accountType, setAccountType] = useState<"trial" | "paid">("trial");

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  try {
    const user = await register({
      full_name: fullName,
      email,
      password,
      role,
      phone,
      account_type: accountType,
    });

    if (user.role === "admin") navigate("/admin/system", { replace: true });
    else if (user.role === "mediator") navigate("/admin/moderator", { replace: true });
    else navigate("/dashboard", { replace: true });
  } catch (err) {
    setError((err as Error).message || "Registration failed");
  }
};

const fields: AuthField[] = [
  {
    name: "fullName",
    type: "text",
    placeholder: "Full Name",
    icon: <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />,
    value: fullName,
    onChange: (e) => setFullName(e.target.value),
  },
  {
    name: "email",
    type: "email",
    placeholder: "Email ID",
    icon: <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />,
    value: email,
    onChange: (e) => setEmail(e.target.value),
  },
  {
    name: "password",
    type: "password",
    placeholder: "Password",
    icon: <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />,
    value: password,
    onChange: (e) => setPassword(e.target.value),
  },
  {
    name: "role",
    type: "select",
    placeholder: "Role (parent / mediator / admin)",
    icon: <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />,
    value: role,
    onChange: (e) =>
      setRole(e.target.value as "parent" | "mediator" | "admin"),
  },
  {
    name: "phone",
    type: "text",
    placeholder: "Phone (optional)",
    icon: <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />,
    value: phone,
    onChange: (e) => setPhone(e.target.value),
  },
  {
    name: "accountType",
    type: "select",
    placeholder: "Choose plan (Trial or Paid)",
    icon: <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />,
    value: accountType,
    onChange: (e) => setAccountType(e.target.value as "trial" | "paid"),
  },
];

  return (
    <AuthPage title="Register" illustration={RegisterPng}>
      <AuthForm fields={fields} onSubmit={handleRegister} buttonLabel="Register" error={error} />
      <div className="space-y-3 mb-4">
        <label className="text-sm font-medium">Choose Plan</label>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setAccountType("trial")}
            className={`px-4 py-2 rounded-full border ${
              accountType === "trial" ? "bg-primary text-white" : ""
            }`}
          >
            Trial (2 days)
          </button>

          <button
            type="button"
            onClick={() => setAccountType("paid")}
            className={`px-4 py-2 rounded-full border ${
              accountType === "paid" ? "bg-primary text-white" : ""
            }`}
          >
            Paid
          </button>
        </div>
      </div>
    </AuthPage>
  );
}
