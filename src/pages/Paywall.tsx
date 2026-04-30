import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { requiresPaywall } from "@/lib/billing";

export default function Paywall() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }

    if (!requiresPaywall(user)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const handleLogout = () => {
    logout();
    navigate("/signin", { replace: true });
  };

  if (!user) return null;

  const paymentReference = user.id || user.email;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-3xl shadow-sm p-8 space-y-6">
            <h1 className="font-display text-3xl font-bold text-primary">Payment Required</h1>
            <p className="text-foreground/80">
              Your trial has ended. Please complete payment to continue using your account.
            </p>

            <div className="rounded-2xl border border-border p-5 bg-secondary/30 space-y-2">
              <p className="font-medium">Bank transfer details</p>
              <p className="text-sm text-foreground/80">Account name: CUB Parenting App</p>
              <p className="text-sm text-foreground/80">Bank: Your Bank Name</p>
              <p className="text-sm text-foreground/80">Account number: 0000000000</p>
              <p className="text-sm text-foreground/80">Branch code: 000000</p>
              <p className="text-sm text-foreground/80">Reference: {paymentReference}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              After payment, email proof of payment to support@cubapp.co.za with your reference.
            </p>

            <div className="flex gap-3">
              <Button onClick={handleLogout}>Sign out</Button>
              <Button
                variant="outline"
                onClick={() => window.open("mailto:support@cubapp.co.za?subject=Payment%20Proof", "_blank")}
              >
                Email proof
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
