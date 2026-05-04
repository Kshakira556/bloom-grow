import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Upload, FileText, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";
import * as api from "@/lib/api";
import { vaultReadService } from "@/lib/vaultReadService";
import { VaultAggregate } from "@/types/vaultAggregate";
import { vaultSaveService } from "@/lib/vaultSaveService";
import { AddChildModal } from "@/components/AddChildModal";
import { isSupabaseConfigured } from "@/lib/supabaseStorage";

type VaultAggregateWithMissing = VaultAggregate & {
  vaultMissing?: boolean;
  vaultMissingNote?: string; 
};

const toDateOnly = (value?: string) => {
  const v = (value || "").trim();
  if (!v) return "";
  return v.split("T")[0].split(" ")[0];
};

const getExportTimeZoneLabel = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ? `Time zone: ${tz}` : "";
  } catch {
    return "";
  }
};

const Children = () => {  
  // New state
  const [selectedChild, setSelectedChild] = useState<VaultAggregateWithMissing | null>(null);
  const [children, setChildren] = useState<{ id: string; name: string; birth_date?: string }[]>([]);
  const [defaultPlanId, setDefaultPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const restrictedNames = selectedChild?.legal?.contactType || "";
  const [showAddChild, setShowAddChild] = useState(false);

  const fetchChildren = async () => {
    try {
      const allChildren = await api.getChildren();

      const mapped = allChildren.map(child => ({
        id: child.id,
        name: `${child.first_name}${child.last_name ? ` ${child.last_name}` : ""}`,
        birth_date: child.birth_date,
      }));

      setChildren(mapped);

      // ✅ AUTO-SELECT FIRST CHILD (critical fix)
      if (mapped.length > 0) {
        await handleChildChange(mapped[0].id, mapped[0].name, mapped[0].birth_date);
      } else {
        setLoading(false); // no children case
      }

    } catch (err) {
      console.error(err);
      setLoading(false); // ❗ ensure UI never locks
    }
  };

  const handleChildChange = async (
    childId: string,
    childName?: string,
    childBirthDate?: string
  ) => {
    setLoading(true);
    try {
      let vaultAggregate: VaultAggregate | null = null;
      let vaultMissingNote: string | undefined;

      const result = await vaultReadService
        .getVaultAggregate(childId, childName)
        .catch((err) => {
          if (err?.response?.status === 404) {
            vaultMissingNote = "No vault exists for this child yet.";
            return null;
          }
          throw err;
        });

      vaultAggregate = result;

      const defaultDob = toDateOnly(childBirthDate);

      const aggregate: VaultAggregateWithMissing = vaultAggregate
        ? {
            ...vaultAggregate,
            vault: {
              ...vaultAggregate.vault,
              fullName: vaultAggregate.vault.fullName || childName || "Unnamed Child",
              dob: toDateOnly(vaultAggregate.vault.dob) || defaultDob,
            },
          }
        : {
            childId,
            vault: { fullName: childName || "Unnamed Child", nickname: "", dob: defaultDob, idPassportNo: "", homeAddress: "" },
            guardians: [],
            legal: { custodyType: "", caseNo: "", validUntil: "", contactType: "" },
            medical: { bloodType: "", allergies: "", medication: "", doctor: "" },
            safety: { approvedPickup: "", notAllowedPickup: "" },
            emergencyContacts: [],
            documents: [],
          };

      setSelectedChild({
        ...aggregate,
        vaultMissing: vaultAggregate === null,
        vaultMissingNote: vaultAggregate === null ? vaultMissingNote : undefined,
        legal: aggregate.legal || { custodyType: "", caseNo: "", validUntil: "", contactType: "" },
        medical: aggregate.medical || { bloodType: "", allergies: "", medication: "", doctor: "" },
        safety: aggregate.safety || { approvedPickup: "", notAllowedPickup: "" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    const fetchDefaultPlanId = async () => {
      try {
        const { plans } = await api.getPlans();
        setDefaultPlanId(plans?.[0]?.id ?? null);
      } catch (err) {
        console.warn("Unable to resolve default plan for add-child flow:", err);
        setDefaultPlanId(null);
      }
    };

    fetchDefaultPlanId();
  }, []);

  const categories = {
    Legal: [
      "Birth certificate",
      "Custody agreements",
      "Court orders",
      "Adoption papers",
      "Parental agreements",
    ],
    Medical: ["Vaccination record", "Clinic card", "Prescriptions", "Lab reports"],
    Safety: ["Approved pick-up list", "Not allowed list"],
    Emergency: ["Emergency contact 1", "Emergency contact 2"],
    School: ["Report card", "Progress report", "Registration form"],
    Other: ["Photos", "Artwork", "Certificates"],
  };

  // State
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [editMode, setEditMode] = useState(false);
  const supabaseReady = isSupabaseConfigured();
  const [selectedDocKeys, setSelectedDocKeys] = useState<string[]>([]);

  const handleFileUpload = (files: FileList | null) => {
    if (!supabaseReady) {
      alert("Document uploads are not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your frontend environment to enable persistent document storage.");
      return;
    }
    if (!files || !selectedCategory || !selectedSubcategory) return;

    const newDocs = Array.from(files).map(file => ({
      name: file.name,
      file,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      isNew: true
    }));

    setSelectedChild(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        documents: [...(prev.documents || []), ...newDocs]
      };
    });
  };

  const downloadFiles = (files: { file: File }[]) => {
    files.forEach(({ file }) => {
      const url = URL.createObjectURL(file);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const downloadUrls = (items: { url: string; filename: string }[]) => {
    items.forEach(({ url, filename }) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "document";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const toggleDocKey = (key: string) => {
    setSelectedDocKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const openVaultDoc = async (documentId?: string) => {
    if (!documentId) return;
    try {
      const url = await api.getVaultDocumentSignedUrl(documentId);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to open document:", err);
      alert(err instanceof Error ? err.message : "Failed to open document");
    }
  };

  const filteredFiles = (selectedChild?.documents || []).filter(
    f =>
      (!selectedCategory || f.category === selectedCategory) &&
      (!selectedSubcategory || f.subcategory === selectedSubcategory)
  );

  if (loading) return <div>Loading...</div>;

  if (!selectedChild) {
    return <div>No child selected</div>;
  }

  return (  
    <div className="min-h-screen gradient-bg flex flex-col">
      <style>
        {`
        .print-only {
          display: none;
        }

        @media print {
          @page {
            size: A4;
            margin: 10mm 12mm;
          }

          .print-only {
            display: block !important;
          }

          body {
            font-family: "Times New Roman", Georgia, serif;
            color: #000;
            background: #fff;
            margin: 0 !important;
            padding: 0 !important;
          }

          header {
            display: none !important;
          }

          #print-area,
          #print-area * {
            visibility: visible;
          }

          #print-area {
            position: relative;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            top: 0 !important;
            left: 0 !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .rounded-2xl,
          .rounded-3xl,
          .shadow-sm,
          .bg-card,
          .bg-card\\/50,
          .bg-cub-mint-light {
            background: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          h2, h3 {
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 13px;
          }

          p, span, div {
            font-size: 12px;
            line-height: 1.45;
          }

          .legal-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
          }

          .legal-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            vertical-align: top;
          }

          .legal-label {
            width: 35%;
            font-weight: bold;
          }

          .no-print {
            display: none !important;
          }

          .mt-6,
          .mt-8,
          .mb-6,
          .mb-8,
          .py-6,
          .py-8,
          .p-6 {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        `}
        </style>

      <Navbar />
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6 no-print">
            Vault
          </h1>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-3 no-print">
              <select
                aria-label="Child-Name"
                value={selectedChild?.childId || ""}
                onChange={async (e) => {
                  const id = e.target.value;
                  const matched = children.find(c => c.id === id);
                  const name = matched?.name; // grab name directly
                  const birthDate = matched?.birth_date;
                  setSelectedChild(null); 
                  await handleChildChange(id, name, birthDate);
                }}
                className="w-full p-3 rounded-2xl bg-card/50 border text-sm font-display"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddChild(true)}
                className="w-full p-4 rounded-2xl bg-card/50 hover:bg-card text-left flex items-center gap-2 text-muted-foreground"
              >
                <Plus className="w-4 h-4" />
                Add Child
              </button>
            </div>

            {/* Child Details */}
            <div className="lg:col-span-9">
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-6">
                  <div id="print-area">
                    <div style={{ marginBottom: "16px" }}>
                      <h1 style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>
                        CHILD INFORMATION & LEGAL RECORD
                      </h1>

                      <p style={{ textAlign: "center", fontSize: "12px" }}>
                        This document is generated for official family, medical, and legal use.
                      </p>

                      <p style={{ textAlign: "center", fontSize: "11px", marginTop: "4px" }}>
                        Generated on: {toDateOnly(new Date().toISOString())}
                      </p>
                    </div>

                    <div className="mb-6 text-sm print-only">
                      <p>Exported: {toDateOnly(new Date().toISOString())}</p>
                      {getExportTimeZoneLabel() && <p>{getExportTimeZoneLabel()}</p>}
                      <p>Filter applied: Vault record</p>

                      <div className="mt-4">
                        <p className="font-display font-bold">1. Parties</p>
                        <p>1.1 Participant A (exporting user): You.</p>
                        <p>1.2 Child: {selectedChild?.vault?.fullName || "Unnamed"}.</p>
                        {selectedChild?.vault?.nickname?.trim() ? (
                          <p>1.3 Child nickname: {selectedChild.vault.nickname.trim()}.</p>
                        ) : null}
                        {selectedChild?.guardians?.length ? (
                          <p>
                            1.4 Guardians:{" "}
                            {selectedChild.guardians
                              .map((g) => g?.name)
                              .filter(Boolean)
                              .join(", ") || "-"}
                            .
                          </p>
                        ) : (
                          <p>1.4 Guardians: -.</p>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="font-display font-bold">2. Reliability and audit trail</p>
                        <p>2.1 This record is generated by the CUB application as a PDF export of an in-app vault record.</p>
                        <p>2.2 Dates and timestamps reflect the system time recorded by the application services at the time of saving or updating.</p>
                        <p>2.3 This PDF is not password-protected and is intended to be readable and shareable for review, mediation, or court-related purposes.</p>
                        <p>2.4 Edits and deletions (where applicable) are reflected in the saved record as of the export date.</p>
                        <p>2.5 Supporting documents are listed below and may include external file links where available.</p>
                      </div>

                      <div style={{ pageBreakAfter: "always" }} />
                    </div>
                    {/* Basic Info */}
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="font-display font-bold text-xl">
                          {selectedChild?.vault?.fullName || "Unnamed"}
                          {selectedChild?.vault?.nickname ? ` (${selectedChild.vault.nickname})` : ""}
                        </h2>
                        <button
                          className="p-2 rounded-full hover:bg-card/50 no-print"
                          onClick={() => setEditMode(!editMode)}
                          title={editMode ? "View Mode" : "Edit Mode"}
                        >
                          <Edit3 className="w-5 h-5 text-primary" />
                        </button>

                      </div>

                      {editMode && (
                        <div className="text-sm font-display font-semibold text-primary mb-2">
                          Child details
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">DOB:</span>{" "}
                          {editMode ? (
                            <Input
                              value={selectedChild?.vault?.dob || ""}
                              onChange={(e) =>
                                setSelectedChild({ 
                                  ...selectedChild, 
                                  vault: {...selectedChild?.vault, dob: e.target.value} 
                                })
                              }
                              placeholder="YYYY-MM-DD"
                            />
                          ) : (
                            toDateOnly(selectedChild.vault.dob)
                          )}
                          {editMode && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Use the child&apos;s date of birth (format: YYYY-MM-DD).
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">ID:</span>{" "}
                          {editMode ? (
                            <Input
                              value={selectedChild?.vault?.idPassportNo || ""}
                              onChange={(e) =>
                                setSelectedChild({ 
                                  ...selectedChild, 
                                  vault: {...selectedChild?.vault, idPassportNo: e.target.value} 
                                })
                              }
                              placeholder="SA ID or Passport number"
                            />
                          ) : (
                            selectedChild.vault.idPassportNo
                          )}
                          {editMode && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the child&apos;s SA ID number or passport number (if applicable).
                            </p>
                          )}
                        </div>
                      </div>

                      {editMode ? (
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground mb-1">Home address</div>
                          <Input
                            value={selectedChild?.vault.homeAddress || ""}
                            onChange={(e) =>
                              setSelectedChild(prev => prev ? { ...prev, vault: {...prev.vault, homeAddress: e.target.value} } : prev)
                            }
                            placeholder="Street address, suburb, city"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Provide the primary home address where the child resides.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedChild.vault.homeAddress}
                        </p>
                      )}
                    </div>

                    {/* Guardian Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedChild.guardians.map((g, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-cub-mint-light rounded-2xl"
                        >
                          <p className="font-display font-bold mb-2">
                            Guardian {idx + 1}
                          </p>

                          {editMode ? (
                            <>
                              <Input
                                value={g.name}
                                onChange={(e) => {
                                  const newGuardians = [...selectedChild.guardians];
                                  newGuardians[idx].name = e.target.value;
                                  setSelectedChild({ ...selectedChild, guardians: newGuardians });
                                }}
                                placeholder="Guardian full name"
                                className="mb-1"
                              />
                              <Input
                                value={g.cell}
                                onChange={(e) => {
                                  const newGuardians = [...selectedChild.guardians];
                                  newGuardians[idx].cell = e.target.value;
                                  setSelectedChild({ ...selectedChild, guardians: newGuardians });
                                }}
                                placeholder="Cell number (e.g., +27 82 123 4567)"
                                className="mb-1"
                              />
                              <Input
                                value={g.work}
                                onChange={(e) => {
                                  const newGuardians = [...selectedChild.guardians];
                                  newGuardians[idx].work = e.target.value;
                                  setSelectedChild({ ...selectedChild, guardians: newGuardians });
                                }}
                                placeholder="Work number (optional)"
                              />
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">{g.name}</p>
                              <p className="text-sm text-muted-foreground">Cell: {g.cell}</p>
                              <p className="text-sm text-muted-foreground">Work: {g.work}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Sections Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-display font-bold mb-3">Legal</h3>
                        <div className="space-y-2 text-sm">
                          {editMode ? (
                            <>
                              <Input
                                value={selectedChild?.legal?.custodyType}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    legal: { ...selectedChild.legal, custodyType: e.target.value },
                                  })
                                }
                                placeholder="Custody arrangement (e.g., Joint custody)"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.legal?.caseNo}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    legal: { ...selectedChild.legal, caseNo: e.target.value },
                                  })
                                }
                                placeholder="Court reference / case number"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.legal?.validUntil}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    legal: { ...selectedChild.legal, validUntil: e.target.value },
                                  })
                                }
                                placeholder="Valid until (YYYY-MM-DD)"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.legal?.contactType || ""}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild!,
                                    legal: { ...selectedChild!.legal, contactType: e.target.value }
                                  })
                                }
                                placeholder="Legally restricted persons (comma-separated)"
                              />
                            </>
                          ) : (
                            <>
                              <table className="legal-table">
                                <tbody>
                                  <tr>
                                    <td className="legal-label">Custody Arrangement</td>
                                    <td>{selectedChild?.legal?.custodyType}</td>
                                  </tr>
                                  <tr>
                                    <td className="legal-label">Court Reference Number</td>
                                    <td>{selectedChild?.legal?.caseNo}</td>
                                  </tr>
                                  <tr>
                                    <td className="legal-label">Valid Until</td>
                                    <td>{toDateOnly(selectedChild?.legal?.validUntil)}</td>
                                  </tr>
                                  <tr>
                                    <td className="legal-label">Legally Restricted Persons</td>
                                    <td>{selectedChild?.legal?.contactType || ""}</td>
                                  </tr>
                                </tbody>
                              </table>
                              <p>
                                <span className="text-muted-foreground">Valid until:</span>{" "}
                                {toDateOnly(selectedChild?.legal?.validUntil)}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Names legally restricted:</span>{" "}
                                {restrictedNames}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-display font-bold mb-3">Medical</h3>
                        <div className="space-y-2 text-sm">
                          {editMode ? (
                            <>
                              <Input
                                value={selectedChild?.medical?.bloodType}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    medical: { ...selectedChild.medical, bloodType: e.target.value },
                                  })
                                }
                                placeholder="Blood type"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.medical?.allergies}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    medical: { ...selectedChild.medical, allergies: e.target.value },
                                  })
                                }
                                placeholder="Allergies"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.medical?.medication}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    medical: { ...selectedChild.medical, medication: e.target.value },
                                  })
                                }
                                placeholder="Medication"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.medical?.doctor}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    medical: { ...selectedChild.medical, doctor: e.target.value },
                                  })
                                }
                                placeholder="Doctor contact"
                              />
                            </>
                          ) : (
                            <>
                              <p>
                                <span className="text-muted-foreground">Blood type:</span>{" "}
                                {selectedChild?.medical?.bloodType}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Allergies:</span>{" "}
                                {selectedChild?.medical?.allergies}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Medication:</span>{" "}
                                {selectedChild?.medical?.medication}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Doctor contact:</span>{" "}
                                {selectedChild?.medical?.doctor}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-display font-bold mb-3">
                          Safety & Pick-up
                        </h3>
                        <div className="space-y-2 text-sm">
                          {editMode ? (
                            <>
                              <Input
                                value={selectedChild?.safety?.approvedPickup}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    safety: { ...selectedChild.safety, approvedPickup: e.target.value },
                                  })
                                }
                                placeholder="Approved pick-up persons"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild?.safety?.notAllowedPickup}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    safety: { ...selectedChild.safety, notAllowedPickup: e.target.value },
                                  })
                                }
                                placeholder="Not allowed persons"
                              />
                            </>
                          ) : (
                            <>
                              <p>
                                <span className="text-muted-foreground">Approved pick-up persons:</span>{" "}
                                {selectedChild?.safety?.approvedPickup}
                              </p>
                              <p>
                                <span className="text-muted-foreground">NOT allowed:</span>{" "}
                                {selectedChild?.safety?.notAllowedPickup}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-display font-bold mb-3">
                          Emergency Contacts
                        </h3>
                        <div className="space-y-2 text-sm">
                          {editMode ? (
                            <>
                                <Input
                                  value={selectedChild?.emergencyContacts?.[0]?.phone || ""}
                                  onChange={(e) => {
                                    const newContacts = [...(selectedChild?.emergencyContacts || [])];
                                    newContacts[0] = { ...newContacts[0], phone: e.target.value, name: newContacts[0]?.name || "" };
                                    setSelectedChild({ ...selectedChild!, emergencyContacts: newContacts });
                                  }}
                                  placeholder="Emergency contact 1 phone (e.g., +27 82 123 4567)"
                                />

                                <Input
                                  value={selectedChild?.emergencyContacts?.[1]?.phone || ""}
                                  onChange={(e) => {
                                    const newContacts = [...(selectedChild?.emergencyContacts || [])];
                                    newContacts[1] = { ...newContacts[1], phone: e.target.value, name: newContacts[1]?.name || "" };
                                    setSelectedChild({ ...selectedChild!, emergencyContacts: newContacts });
                                  }}
                                  placeholder="Emergency contact 2 phone (optional)"
                                />
                            </>
                          ) : (
                            <>
                              <p>
                                <span className="text-muted-foreground">Emergency 1:</span>{" "}
                                {selectedChild?.emergencyContacts?.[0]?.phone || ""}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Emergency 2:</span>{" "}
                                {selectedChild?.emergencyContacts?.[1]?.phone || ""}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h3 className="font-display font-bold mb-3">
                        Child Documents
                      </h3>

                      {/* Dropdowns + Export */}
                      {editMode && (
                        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                          {/* Main Category */}
                          <select
                            aria-label="Document Category"
                            value={selectedCategory}
                            onChange={(e) => {
                              setSelectedCategory(e.target.value);
                              setSelectedSubcategory("");
                            }}
                            className="p-2 rounded-lg border bg-cub-mint-light text-sm"
                          >
                            <option value="">Select Category</option>
                            {Object.keys(categories).map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>

                          {/* Subcategory */}
                          <select
                            aria-label="Document Subcategory"
                            value={selectedSubcategory}
                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                            disabled={!selectedCategory}
                            className="p-2 rounded-lg border bg-cub-mint-light text-sm"
                          >
                            <option value="">Select Subcategory</option>
                            {selectedCategory &&
                              categories[selectedCategory].map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))
                            }
                          </select>

                          {/* Upload */}
                          <label
                            className={`flex items-center gap-2 px-4 py-2 bg-cub-mint-light rounded-lg text-sm ${
                              supabaseReady ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                            }`}
                            title={
                              supabaseReady
                                ? "Upload documents"
                                : "Uploads disabled: Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."
                            }
                          >
                            <Upload className="w-4 h-4 text-primary" />
                            <span>Upload files</span>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              disabled={!supabaseReady}
                              onChange={(e) => handleFileUpload(e.target.files)}
                            />
                          </label>
                        </div>
                      )}
                      {editMode && !supabaseReady && (
                        <p className="text-xs text-muted-foreground -mt-2">
                          Uploads won&apos;t persist until document storage is configured.
                        </p>
                      )}

                      {/* Display uploaded files */}
                      <div className="space-y-2">
                        {editMode ? (
                          <>

                            {/* Show files already uploaded */}
                            {(selectedChild?.documents || [])
                              .filter(
                                (f) =>
                                  (!selectedCategory || f.category === selectedCategory) &&
                                  (!selectedSubcategory || f.subcategory === selectedSubcategory)
                              )
                              .map((file, idx) => {
                                const fileName = file.file?.name || file.name || "Unnamed file"; // ✅ safe
                                return (
                                  <div key={idx} className="p-2 bg-cub-mint-light rounded-xl flex items-center gap-2 text-xs">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="flex-1">{file.category} → {file.subcategory}: {fileName}</span>
                                  </div>
                                );
                            })}
                          </>
                        ) : (
                          <>
                            {selectedDocKeys.length > 0 && (
                              <div className="flex justify-end mb-2 no-print">
                                <Button
                                  variant="outline"
                                  className="rounded-full"
                                  onClick={() => {
                                    const picked = (selectedChild?.documents || [])
                                      .map((f, idx) => {
                                        const fileName = f.file?.name || f.name || "document";
                                        const key = f.id || `${idx}-${fileName}`;
                                        const url = f.file ? URL.createObjectURL(f.file) : "";
                                        return { key, url, docId: f.id, fileName, isObjectUrl: Boolean(f.file) };
                                      })
                                      .filter((x) => selectedDocKeys.includes(x.key));

                                    const localDownloads = picked.filter((p) => p.isObjectUrl && p.url);
                                    downloadUrls(localDownloads.map((p) => ({ url: p.url, filename: p.fileName })));

                                    const remoteDownloads = picked.filter((p) => !p.isObjectUrl && p.docId);
                                    (async () => {
                                      const resolved = await Promise.all(
                                        remoteDownloads.map(async (p) => ({
                                          url: await api.getVaultDocumentSignedUrl(p.docId as string),
                                          filename: p.fileName,
                                        }))
                                      );
                                      downloadUrls(resolved);
                                    })().catch((err) => {
                                      console.error("Failed to download selected documents:", err);
                                      alert(err instanceof Error ? err.message : "Failed to download documents");
                                    });

                                    picked.forEach((p) => {
                                      if (p.isObjectUrl) URL.revokeObjectURL(p.url);
                                    });

                                    setSelectedDocKeys([]);
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download selected
                                </Button>
                              </div>
                            )}

                            {(selectedChild?.documents || []).map((file, idx) => {
                              const fileName = file.file?.name || file.name || "Unnamed file"; // ✅ safe
                              const fileURL = file.file ? URL.createObjectURL(file.file) : "";
                              const key = file.id || `${idx}-${fileName}`;

                              return (
                                <div
                                  key={idx}
                                  className="p-2 bg-cub-mint-light rounded-xl flex items-center gap-2 text-xs"
                                >
                                  <FileText className="w-4 h-4 text-primary" />

                                  <span className="flex-1">
                                    <span className="font-semibold">{file.category}</span>
                                    {" → "}
                                    {file.subcategory}: {fileName}
                                  </span>

                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-primary no-print"
                                    aria-label={`Select ${fileName} for download`}
                                    checked={selectedDocKeys.includes(key)}
                                    onChange={() => toggleDocKey(key)}
                                  />

                                  {(file.file || file.fileUrl || (file as any).file_url) && (
                                    <button
                                      className="p-1 rounded hover:bg-card/50 no-print"
                                      onClick={() => {
                                        if (file.file) {
                                          const url = URL.createObjectURL(file.file);
                                          window.open(url, "_blank");
                                          URL.revokeObjectURL(url);
                                          return;
                                        }

                                        openVaultDoc(file.id);
                                      }}
                                      title="Preview document"
                                    >
                                      <Eye className="w-4 h-4 text-primary" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            
                            {(selectedChild?.documents || []).length === 0 && (
                              <p className="text-xs text-muted-foreground">No documents uploaded.</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <p style={{ marginTop: "40px", fontSize: "10px", borderTop: "1px solid #000", paddingTop: "8px" }}>
                      This record reflects information provided by the legal guardian(s) at the time
                      of generation and is intended for official reference only.
                    </p>

                  </div>
                  {editMode ? (
                    <Button
                      onClick={async () => {
                        if (!selectedChild) return;

                        const vault = selectedChild.vault;
                        if (!vault.fullName || vault.fullName.trim() === "") {
                          alert("Child full name is required");
                          return;
                        }

                        const safeAggregate = {
                          ...selectedChild,
                          vault: { 
                            fullName: vault.fullName.trim(),
                            nickname: vault.nickname?.trim() || undefined,
                            dob: vault.dob?.trim() || undefined,
                            idPassportNo: vault.idPassportNo?.trim() || undefined,
                            homeAddress: vault.homeAddress?.trim() || undefined,
                          },
                          guardians: selectedChild.guardians
                            .filter(g => g.name?.trim())
                            .map(g => ({
                              ...g,
                              name: g.name.trim(),
                              cell: g.cell?.trim() || undefined,
                              work: g.work?.trim() || undefined,
                            })),
                          emergencyContacts: selectedChild.emergencyContacts
                            .map((e, index) => ({
                              ...e,
                              name: e.name?.trim() || `Emergency Contact ${index + 1}`,
                              phone: e.phone?.trim() || "",
                            }))
                            .filter(e => e.phone.length > 0),
                          documents: selectedChild.documents.filter(d => d.name && (d.file || d.fileUrl))
                        };

                        try {
                          setLoading(true);
                          await vaultSaveService.saveVaultAggregate(safeAggregate);
                          setEditMode(false);
                          alert("Vault saved successfully!");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-full no-print"
                      onClick={() => window.print()}
                    >
                      Export to PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      {showAddChild && (
        <AddChildModal
          planId={defaultPlanId}
          onClose={() => setShowAddChild(false)}
          onCreated={async () => {
            await fetchChildren();     // refresh dropdown
            setShowAddChild(false);
          }}
        />
      )}
    </div>
  );
};

export default Children;

