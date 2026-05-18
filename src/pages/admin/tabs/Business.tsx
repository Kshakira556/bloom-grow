import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

type Address = {
  street?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

const listToCsv = (v: string[] | null | undefined) => (v && v.length ? v.join(", ") : "");
const csvToList = (raw: string): string[] => {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const BusinessTab = () => {
  const [businessName, setBusinessName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  const [primaryContactFullName, setPrimaryContactFullName] = useState("");
  const [primaryContactTitle, setPrimaryContactTitle] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [primaryContactMobile, setPrimaryContactMobile] = useState("");

  const [registeredAddress, setRegisteredAddress] = useState<Address>({});
  const [billingAddress, setBillingAddress] = useState<Address>({});
  const [billingSameAsRegistered, setBillingSameAsRegistered] = useState(true);

  const [mediatorCount, setMediatorCount] = useState<string>("");
  const [expectedMediatorCount, setExpectedMediatorCount] = useState<string>("");
  const [planCount, setPlanCount] = useState<string>("");
  const [plansPerMonth, setPlansPerMonth] = useState<string>("");
  const [expectedPlansPerMonth, setExpectedPlansPerMonth] = useState<string>("");

  const [provincesServed, setProvincesServed] = useState("");
  const [languagesOffered, setLanguagesOffered] = useState("");
  const [serviceModalities, setServiceModalities] = useState("");
  const [typicalSessionLengthMinutes, setTypicalSessionLengthMinutes] = useState<string>("");

  const [popiaAcknowledged, setPopiaAcknowledged] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState("");
  const [legalHoldContactEmail, setLegalHoldContactEmail] = useState("");

  const [billingEmail, setBillingEmail] = useState("");
  const [purchaseOrderReference, setPurchaseOrderReference] = useState("");
  const [paymentMethodPreference, setPaymentMethodPreference] = useState("");

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
          setTradingName(profile.trading_name ?? "");
          setRegistrationNumber(profile.registration_number ?? "");
          setVatNumber(profile.vat_number ?? "");
          setIndustry(profile.industry ?? "");
          setWebsite(profile.website ?? "");

          setPrimaryContactFullName(profile.primary_contact_full_name ?? "");
          setPrimaryContactTitle(profile.primary_contact_title ?? "");
          setPrimaryContactEmail(profile.primary_contact_email ?? "");
          setPrimaryContactMobile(profile.primary_contact_mobile ?? "");

          setRegisteredAddress((profile.registered_address as Address) ?? {});
          setBillingAddress((profile.billing_address as Address) ?? {});
          setBillingSameAsRegistered(
            typeof profile.billing_same_as_registered === "boolean"
              ? profile.billing_same_as_registered
              : true
          );

          setMediatorCount(
            typeof profile.mediator_count === "number" ? String(profile.mediator_count) : ""
          );
          setExpectedMediatorCount(
            typeof profile.expected_mediator_count === "number"
              ? String(profile.expected_mediator_count)
              : ""
          );
          setPlanCount(typeof profile.plan_count === "number" ? String(profile.plan_count) : "");
          setPlansPerMonth(
            typeof profile.plans_per_month === "number" ? String(profile.plans_per_month) : ""
          );
          setExpectedPlansPerMonth(
            typeof profile.expected_plans_per_month === "number"
              ? String(profile.expected_plans_per_month)
              : ""
          );

          setProvincesServed(listToCsv(profile.provinces_served));
          setLanguagesOffered(listToCsv(profile.languages_offered));
          setServiceModalities(listToCsv(profile.service_modalities));
          setTypicalSessionLengthMinutes(
            typeof profile.typical_session_length_minutes === "number"
              ? String(profile.typical_session_length_minutes)
              : ""
          );

          setPopiaAcknowledged(Boolean(profile.popia_acknowledged_at));
          setRetentionPolicy(profile.retention_policy ?? "");
          setLegalHoldContactEmail(profile.legal_hold_contact_email ?? "");

          setBillingEmail(profile.billing_email ?? "");
          setPurchaseOrderReference(profile.purchase_order_reference ?? "");
          setPaymentMethodPreference(profile.payment_method_preference ?? "");
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

      const expectedMediatorCountParsed = parseNonNegativeInt(expectedMediatorCount);
      if (Number.isNaN(expectedMediatorCountParsed)) {
        setError("Expected mediators must be a non-negative whole number");
        return;
      }

      const plansPerMonthParsed = parseNonNegativeInt(plansPerMonth);
      if (Number.isNaN(plansPerMonthParsed)) {
        setError("Plans per month must be a non-negative whole number");
        return;
      }

      const expectedPlansPerMonthParsed = parseNonNegativeInt(expectedPlansPerMonth);
      if (Number.isNaN(expectedPlansPerMonthParsed)) {
        setError("Expected plans per month must be a non-negative whole number");
        return;
      }

      const typicalSessionLengthMinutesParsed = parseNonNegativeInt(typicalSessionLengthMinutes);
      if (Number.isNaN(typicalSessionLengthMinutesParsed)) {
        setError("Typical session length must be a non-negative whole number (minutes)");
        return;
      }

      const saved = await api.upsertBusinessProfile({
        business_name: name,
        mediator_count: mediatorCountParsed,
        plan_count: planCountParsed,
        trading_name: tradingName.trim() || null,
        registration_number: registrationNumber.trim() || null,
        vat_number: vatNumber.trim() || null,
        industry: industry.trim() || null,
        website: website.trim() || null,

        primary_contact_full_name: primaryContactFullName.trim() || null,
        primary_contact_title: primaryContactTitle.trim() || null,
        primary_contact_email: primaryContactEmail.trim() || null,
        primary_contact_mobile: primaryContactMobile.trim() || null,

        registered_address: registeredAddress ?? null,
        billing_same_as_registered: billingSameAsRegistered,
        billing_address: billingSameAsRegistered ? registeredAddress ?? null : billingAddress ?? null,

        expected_mediator_count: expectedMediatorCountParsed,
        plans_per_month: plansPerMonthParsed,
        expected_plans_per_month: expectedPlansPerMonthParsed,

        provinces_served: csvToList(provincesServed),
        languages_offered: csvToList(languagesOffered),
        service_modalities: csvToList(serviceModalities),
        typical_session_length_minutes: typicalSessionLengthMinutesParsed,

        popia_acknowledged_at: popiaAcknowledged ? new Date().toISOString() : null,
        retention_policy: retentionPolicy.trim() || null,
        legal_hold_contact_email: legalHoldContactEmail.trim() || null,

        billing_email: billingEmail.trim() || null,
        purchase_order_reference: purchaseOrderReference.trim() || null,
        payment_method_preference: paymentMethodPreference.trim() || null,
      });

      setBusinessName(saved.business_name ?? name);
      setTradingName(saved.trading_name ?? tradingName);
      setRegistrationNumber(saved.registration_number ?? registrationNumber);
      setVatNumber(saved.vat_number ?? vatNumber);
      setIndustry(saved.industry ?? industry);
      setWebsite(saved.website ?? website);

      setPrimaryContactFullName(saved.primary_contact_full_name ?? primaryContactFullName);
      setPrimaryContactTitle(saved.primary_contact_title ?? primaryContactTitle);
      setPrimaryContactEmail(saved.primary_contact_email ?? primaryContactEmail);
      setPrimaryContactMobile(saved.primary_contact_mobile ?? primaryContactMobile);

      setRegisteredAddress((saved.registered_address as Address) ?? registeredAddress);
      setBillingAddress((saved.billing_address as Address) ?? billingAddress);
      setBillingSameAsRegistered(
        typeof saved.billing_same_as_registered === "boolean"
          ? saved.billing_same_as_registered
          : billingSameAsRegistered
      );
      setMediatorCount(
        typeof saved.mediator_count === "number" ? String(saved.mediator_count) : mediatorCount
      );
      setPlanCount(typeof saved.plan_count === "number" ? String(saved.plan_count) : planCount);
      setExpectedMediatorCount(
        typeof saved.expected_mediator_count === "number"
          ? String(saved.expected_mediator_count)
          : expectedMediatorCount
      );
      setPlansPerMonth(
        typeof saved.plans_per_month === "number" ? String(saved.plans_per_month) : plansPerMonth
      );
      setExpectedPlansPerMonth(
        typeof saved.expected_plans_per_month === "number"
          ? String(saved.expected_plans_per_month)
          : expectedPlansPerMonth
      );
      setProvincesServed(listToCsv(saved.provinces_served));
      setLanguagesOffered(listToCsv(saved.languages_offered));
      setServiceModalities(listToCsv(saved.service_modalities));
      setTypicalSessionLengthMinutes(
        typeof saved.typical_session_length_minutes === "number"
          ? String(saved.typical_session_length_minutes)
          : typicalSessionLengthMinutes
      );
      setPopiaAcknowledged(Boolean(saved.popia_acknowledged_at) || popiaAcknowledged);
      setRetentionPolicy(saved.retention_policy ?? retentionPolicy);
      setLegalHoldContactEmail(saved.legal_hold_contact_email ?? legalHoldContactEmail);
      setBillingEmail(saved.billing_email ?? billingEmail);
      setPurchaseOrderReference(saved.purchase_order_reference ?? purchaseOrderReference);
      setPaymentMethodPreference(saved.payment_method_preference ?? paymentMethodPreference);
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

      {error && <p className="text-sm text-destructive">{error}</p>}
      {savedMsg && <p className="text-sm text-muted-foreground">{savedMsg}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Business identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading business profile...</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Legal entity name
                </label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Example Mediation (Pty) Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Trading name (optional)
                </label>
                <Input
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  placeholder="e.g. Example Mediation"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Registration number (CIPC) (optional)
                  </label>
                  <Input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. 2020/123456/07"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    VAT number (optional)
                  </label>
                  <Input
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="e.g. 4123456789"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Industry / practice type (optional)
                  </label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Mediation practice, Law firm, NGO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Website (optional)
                  </label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. https://example.co.za"
                  />
                </div>
              </div>

            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Primary contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Full name (optional)
              </label>
              <Input
                value={primaryContactFullName}
                onChange={(e) => setPrimaryContactFullName(e.target.value)}
                placeholder="e.g. Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Role / title (optional)
              </label>
              <Input
                value={primaryContactTitle}
                onChange={(e) => setPrimaryContactTitle(e.target.value)}
                placeholder="e.g. Owner, Practice Manager"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email (optional)
              </label>
              <Input
                value={primaryContactEmail}
                onChange={(e) => setPrimaryContactEmail(e.target.value)}
                placeholder="e.g. billing@example.co.za"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Mobile number (optional)
              </label>
              <Input
                value={primaryContactMobile}
                onChange={(e) => setPrimaryContactMobile(e.target.value)}
                placeholder="e.g. +27 82 123 4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Registered address (street) (optional)
              </label>
              <Input
                value={registeredAddress.street ?? ""}
                onChange={(e) =>
                  setRegisteredAddress((a) => ({ ...a, street: e.target.value }))
                }
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                City (optional)
              </label>
              <Input
                value={registeredAddress.city ?? ""}
                onChange={(e) => setRegisteredAddress((a) => ({ ...a, city: e.target.value }))}
                placeholder="City"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Province (optional)
              </label>
              <Input
                value={registeredAddress.province ?? ""}
                onChange={(e) =>
                  setRegisteredAddress((a) => ({ ...a, province: e.target.value }))
                }
                placeholder="Province"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Postal code (optional)
              </label>
              <Input
                value={registeredAddress.postal_code ?? ""}
                onChange={(e) =>
                  setRegisteredAddress((a) => ({ ...a, postal_code: e.target.value }))
                }
                placeholder="Postal code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Country (optional)
              </label>
              <Input
                value={registeredAddress.country ?? "South Africa"}
                onChange={(e) =>
                  setRegisteredAddress((a) => ({ ...a, country: e.target.value }))
                }
                placeholder="Country"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={billingSameAsRegistered}
              onChange={(e) => setBillingSameAsRegistered(e.target.checked)}
            />
            <span className="text-sm text-muted-foreground">Billing address is same as registered</span>
          </div>

          {!billingSameAsRegistered && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Billing address (street) (optional)
                  </label>
                  <Input
                    value={billingAddress.street ?? ""}
                    onChange={(e) => setBillingAddress((a) => ({ ...a, street: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    City (optional)
                  </label>
                  <Input
                    value={billingAddress.city ?? ""}
                    onChange={(e) => setBillingAddress((a) => ({ ...a, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Province (optional)
                  </label>
                  <Input
                    value={billingAddress.province ?? ""}
                    onChange={(e) =>
                      setBillingAddress((a) => ({ ...a, province: e.target.value }))
                    }
                    placeholder="Province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Postal code (optional)
                  </label>
                  <Input
                    value={billingAddress.postal_code ?? ""}
                    onChange={(e) =>
                      setBillingAddress((a) => ({ ...a, postal_code: e.target.value }))
                    }
                    placeholder="Postal code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Country (optional)
                  </label>
                  <Input
                    value={billingAddress.country ?? "South Africa"}
                    onChange={(e) =>
                      setBillingAddress((a) => ({ ...a, country: e.target.value }))
                    }
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team & usage sizing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Number of mediators on staff (now)
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
                Expected mediators in 6–12 months (optional)
              </label>
              <Input
                inputMode="numeric"
                value={expectedMediatorCount}
                onChange={(e) => setExpectedMediatorCount(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Number of plans (current) (optional)
              </label>
              <Input
                inputMode="numeric"
                value={planCount}
                onChange={(e) => setPlanCount(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Approx plans per month (optional)
              </label>
              <Input
                inputMode="numeric"
                value={plansPerMonth}
                onChange={(e) => setPlansPerMonth(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Expected plans per month (optional)
            </label>
            <Input
              inputMode="numeric"
              value={expectedPlansPerMonth}
              onChange={(e) => setExpectedPlansPerMonth(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Provinces served (comma-separated) (optional)
            </label>
            <Input
              value={provincesServed}
              onChange={(e) => setProvincesServed(e.target.value)}
              placeholder="e.g. Gauteng, Western Cape, KwaZulu-Natal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Languages offered (comma-separated) (optional)
            </label>
            <Input
              value={languagesOffered}
              onChange={(e) => setLanguagesOffered(e.target.value)}
              placeholder="e.g. English, Afrikaans, isiZulu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Service modalities (comma-separated) (optional)
            </label>
            <Input
              value={serviceModalities}
              onChange={(e) => setServiceModalities(e.target.value)}
              placeholder="e.g. in_person, online, hybrid"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Typical session length (minutes) (optional)
            </label>
            <Input
              inputMode="numeric"
              value={typicalSessionLengthMinutes}
              onChange={(e) => setTypicalSessionLengthMinutes(e.target.value)}
              placeholder="e.g. 90"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance & consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={popiaAcknowledged}
              onChange={(e) => setPopiaAcknowledged(e.target.checked)}
            />
            <span className="text-sm text-muted-foreground">POPIA acknowledgment</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Data retention preference (optional)
            </label>
            <Input
              value={retentionPolicy}
              onChange={(e) => setRetentionPolicy(e.target.value)}
              placeholder="e.g. default, 5_years, legal_hold_only"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Legal hold contact email (optional)
            </label>
            <Input
              value={legalHoldContactEmail}
              onChange={(e) => setLegalHoldContactEmail(e.target.value)}
              placeholder="e.g. compliance@example.co.za"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Billing email (optional)
            </label>
            <Input
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="e.g. billing@example.co.za"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Purchase order/reference (optional)
              </label>
              <Input
                value={purchaseOrderReference}
                onChange={(e) => setPurchaseOrderReference(e.target.value)}
                placeholder="e.g. PO-12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Payment method preference (optional)
              </label>
              <Input
                value={paymentMethodPreference}
                onChange={(e) => setPaymentMethodPreference(e.target.value)}
                placeholder="e.g. invoice, card, EFT"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessTab;
