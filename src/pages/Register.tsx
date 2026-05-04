// pages/Register.tsx
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthForm, AuthField } from "@/components/auth/AuthForm";
import { User, Mail, Lock, Shield, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RegisterPng from "@/assets/images/register-page.jpeg"

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitedEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const invitedAccountType = useMemo(
    () => (searchParams.get("account_type")?.trim() as "trial" | "paid" | "") || "",
    [searchParams]
  );
  const TERMS_VERSION = "2026-05-04";
  const PRIVACY_VERSION = "2026-05-04";

  const [fullName, setFullName] = useState("");
const [email, setEmail] = useState(invitedEmail);
const [password, setPassword] = useState("");
const [role, setRole] = useState<"parent" | "mediator" | "admin">("parent");
const [phone, setPhone] = useState("");
const [error, setError] = useState("");
const [accountType, setAccountType] = useState<"trial" | "paid">(
  invitedAccountType === "paid" ? "paid" : "trial"
);
const accountTypeLocked = Boolean(invitedAccountType);
const [acceptedTerms, setAcceptedTerms] = useState(false);

useEffect(() => {
  if (invitedEmail) setEmail(invitedEmail);
}, [invitedEmail]);

useEffect(() => {
  if (invitedAccountType === "paid") setAccountType("paid");
  else if (invitedAccountType === "trial") setAccountType("trial");
}, [invitedAccountType]);

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  try {
    if (!acceptedTerms) {
      setError("Please accept the Terms and Privacy Notice to continue.");
      return;
    }

    const inviteId = searchParams.get("invite_id")?.trim() || undefined;

    const user = await register({
      full_name: fullName,
      email,
      password,
      role,
      phone,
      account_type: accountType,
      invite_id: inviteId,
      terms_accepted: true,
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      terms_accepted_at: new Date().toISOString(),
    });

    if (inviteId) {
      navigate("/visits", { replace: true });
      return;
    }

    if (user.role === "admin") navigate("/admin/system", { replace: true });
    else if (user.role === "mediator") navigate("/admin/moderator", { replace: true });
    else if (user.role === "cub_internal") navigate("/cub", { replace: true });
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
    disabled: Boolean(invitedEmail),
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
    disabled: accountTypeLocked,
  },
];

  return (
    <AuthPage title="Register" illustration={RegisterPng}>
      <AuthForm fields={fields} onSubmit={handleRegister} buttonLabel="Register" error={error} />
      <div className="flex items-start gap-2 text-sm mb-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-primary"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
        />
        <p className="text-muted-foreground">
          I agree to the{" "}
          <a className="text-primary hover:underline" href="/terms" target="_blank" rel="noreferrer">
            Terms
          </a>{" "}
          and{" "}
          <a className="text-primary hover:underline" href="/privacy" target="_blank" rel="noreferrer">
            Privacy Notice
          </a>
          .
        </p>
      </div>
      <div className="space-y-3 mb-4">
        <label className="text-sm font-medium">Choose Plan</label>

        <div className={`flex gap-4 ${accountTypeLocked ? "opacity-60 pointer-events-none" : ""}`}>
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

        {accountTypeLocked && (
          <p className="text-xs text-muted-foreground">
            Your plan type is pre-selected for this invite.
          </p>
        )}
      </div>
    </AuthPage>
  );
}
