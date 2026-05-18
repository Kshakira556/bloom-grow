import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

const BusinessTab = () => {
  const [businessName, setBusinessName] = useState("");
  const [mediatorCount, setMediatorCount] = useState<string>("");
  const [planCount, setPlanCount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await api.getBusinessProfile();
        if (profile) {
          setBusinessName(profile.business_name ?? "");
          setMediatorCount(
            typeof profile.mediator_count === "number" ? String(profile.mediator_count) : ""
          );
          setPlanCount(typeof profile.plan_count === "number" ? String(profile.plan_count) : "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load business profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const parseNonNegativeInt = (raw: string): number | null => {
    if (!raw.trim()) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return NaN;
    return n;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSavedMsg(null);

      const name = businessName.trim();
      if (!name) {
        setError("Business name is required");
        return;
      }

      const mediatorCountParsed = parseNonNegativeInt(mediatorCount);
      if (Number.isNaN(mediatorCountParsed)) {
        setError("Number of mediators must be a non-negative whole number");
        return;
      }

      const planCountParsed = parseNonNegativeInt(planCount);
      if (Number.isNaN(planCountParsed)) {
        setError("Number of plans must be a non-negative whole number");
        return;
      }

      const saved = await api.upsertBusinessProfile({
        business_name: name,
        mediator_count: mediatorCountParsed,
        plan_count: planCountParsed,
      });

      setBusinessName(saved.business_name ?? name);
      setMediatorCount(
        typeof saved.mediator_count === "number" ? String(saved.mediator_count) : mediatorCount
      );
      setPlanCount(typeof saved.plan_count === "number" ? String(saved.plan_count) : planCount);
      setSavedMsg("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save business profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Business</h2>

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {savedMsg && <p className="text-sm text-muted-foreground">{savedMsg}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading business profile...</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Business name
                </label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Example Mediation (Pty) Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Number of mediators
                </label>
                <Input
                  inputMode="numeric"
                  value={mediatorCount}
                  onChange={(e) => setMediatorCount(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Number of plans
                </label>
                <Input
                  inputMode="numeric"
                  value={planCount}
                  onChange={(e) => setPlanCount(e.target.value)}
                  placeholder="e.g. 25"
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessTab;

