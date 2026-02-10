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

type VaultAggregateWithMissing = VaultAggregate & {
  vaultMissing?: boolean;
  vaultMissingNote?: string; 
};

const Children = () => {  
  // New state
  const [selectedChild, setSelectedChild] = useState<VaultAggregateWithMissing | undefined>(undefined);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const restrictedNames = selectedChild?.legal?.contactType || "";


  const fetchChildren = async () => {
    try {
      const allChildren = await api.getChildren();
      const mapped = allChildren.map(child => ({
        id: child.id,
        name: `${child.first_name}${child.last_name ? ` ${child.last_name}` : ""}`,
      }));
      setChildren(mapped);

      if (mapped.length > 0) {
        const firstChild = mapped[0];
        console.log("Fetching first child vault:", firstChild);
        await handleChildChange(firstChild.id, firstChild.name);
        console.log("First child loaded:", firstChild.id);
      } else {
        console.log("No children found, initializing empty child");
        setSelectedChild({
          childId: "",
          vault: { fullName: "", nickname: "", dob: "", idPassportNo: "", homeAddress: "" },
          guardians: [],
          legal: { custodyType: "", caseNo: "", validUntil: "", contactType: "" },
          medical: { bloodType: "", allergies: "", medication: "", doctor: "" },
          safety: { approvedPickup: "", notAllowedPickup: "" },
          emergencyContacts: [],
          documents: [],
        });
      }
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setLoading(false); // ✅ only set false after everything finishes
    }
  };
  
  const handleChildChange = async (
    childId: string,
    childName?: string,
    vaultId?: string // ✅ optional vaultId to fetch newly created vault immediately
  ) => {
    setLoading(true);
    try {
      let vaultAggregate: VaultAggregate | null = null;
      let vaultMissingNote: string | undefined;

      const result = await vaultReadService
        .getVaultAggregate(vaultId || childId, childName) // ✅ use vaultId if available
        .catch((err) => {
          if (err?.response?.status === 404) {
            vaultMissingNote = "No vault exists for this child yet.";
            return null;
          }
          throw err;
        });

      vaultAggregate = result;

      const aggregate: VaultAggregateWithMissing = vaultAggregate
        ? { ...vaultAggregate, vault: { ...vaultAggregate.vault, fullName: vaultAggregate.vault.fullName || childName || "Unnamed Child" } }
        : {
            childId,
            vault: { fullName: childName || "Unnamed Child", nickname: "", dob: "", idPassportNo: "", homeAddress: "" },
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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedCategory || !selectedSubcategory) return;

    const newDocs = Array.from(files).map(file => ({
      name: file.name,
      file,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      isNew: true
    }));

    setSelectedChild(prev => ({
      ...prev!,
      documents: [...(prev?.documents || []), ...newDocs]
    }));
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

  const filteredFiles = (selectedChild?.documents || []).filter(
    f =>
      (!selectedCategory || f.category === selectedCategory) &&
      (!selectedSubcategory || f.subcategory === selectedSubcategory)
  );

   if (loading) return <div>Loading...</div>;

  return (  
    <div className="min-h-screen gradient-bg flex flex-col">
      <style>
        {`
        @media print {
          @page {
            size: A4;
            margin: 10mm 12mm;
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
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">
            Vault
          </h1>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-3">
              <select
                aria-label="Child-Name"
                value={selectedChild?.childId || ""}
                onChange={async (e) => {
                  const id = e.target.value;
                  const name = children.find(c => c.id === id)?.name; // grab name directly
                  setSelectedChild(undefined); 
                  await handleChildChange(id, name);
                }}
                className="w-full p-3 rounded-2xl bg-card/50 border text-sm font-display"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>

              <button className="w-full p-4 rounded-2xl bg-card/50 hover:bg-card text-left flex items-center gap-2 text-muted-foreground">
                <Plus className="w-4 h-4" />
                Add profile
              </button>
            </div>


            {/* Child Details */}
            <div className="lg:col-span-9">
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-6">
                  <div id="print-area">
                    <div style={{ marginBottom: "16px" }}>
                    {!selectedChild || selectedChild.vaultMissing ? (
                      <Card>
                        <p className="text-sm text-muted-foreground">
                          {selectedChild?.vaultMissingNote || "No vault exists for this child yet."}
                        </p>
                      </Card>
                    ) : (
                      <Card>
                        <div className="space-y-1">
                          {selectedChild.documents.map((doc, idx) => (
                            <div key={doc.id || idx} className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-primary" />
                              <span>{doc.category} → {doc.subcategory}: {doc.name}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                      <h1 style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>
                        CHILD INFORMATION & LEGAL RECORD
                      </h1>

                      <p style={{ textAlign: "center", fontSize: "12px" }}>
                        This document is generated for official family, medical, and legal use.
                      </p>

                      <p style={{ textAlign: "center", fontSize: "11px", marginTop: "4px" }}>
                        Generated on: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    {/* Basic Info */}
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="font-display font-bold text-xl">
                          {selectedChild?.vault?.fullName || "Unnamed"} ({selectedChild?.vault?.nickname || ""})
                        </h2>
                        <button
                          className="p-2 rounded-full hover:bg-card/50"
                          onClick={() => setEditMode(!editMode)}
                          title={editMode ? "View Mode" : "Edit Mode"}
                        >
                          <Edit3 className="w-5 h-5 text-primary" />
                        </button>
                        {/* Show note if vault missing */}
                        {selectedChild?.vaultMissing && (
                          <p className="text-sm text-destructive mb-2">
                            {selectedChild.vaultMissingNote}
                          </p>
                        )}

                        {/* Step 1: Vault Creation */}
                        {currentStep === 1 && selectedChild?.vaultMissing && (
                          <Card className="p-4 mb-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              {selectedChild?.vaultMissingNote || "No vault exists for this child yet."}
                            </p>

                            <div className="grid gap-3">
                              <Input
                                placeholder="Full Name"
                                value={selectedChild.vault.fullName}
                                onChange={(e) =>
                                  setSelectedChild(prev => prev ? { ...prev, vault: { ...prev.vault, fullName: e.target.value } } : prev)
                                }
                              />
                              <Input
                                placeholder="Nickname"
                                value={selectedChild.vault.nickname}
                                onChange={(e) =>
                                  setSelectedChild(prev => prev ? { ...prev, vault: { ...prev.vault, nickname: e.target.value } } : prev)
                                }
                              />
                              <Input
                                placeholder="Date of Birth"
                                value={selectedChild.vault.dob}
                                type="date"
                                onChange={(e) =>
                                  setSelectedChild(prev => prev ? { ...prev, vault: { ...prev.vault, dob: e.target.value } } : prev)
                                }
                              />
                              <Input
                                placeholder="ID / Passport Number"
                                value={selectedChild.vault.idPassportNo}
                                onChange={(e) =>
                                  setSelectedChild(prev => prev ? { ...prev, vault: { ...prev.vault, idPassportNo: e.target.value } } : prev)
                                }
                              />
                              <Input
                                placeholder="Home Address"
                                value={selectedChild.vault.homeAddress}
                                onChange={(e) =>
                                  setSelectedChild(prev => prev ? { ...prev, vault: { ...prev.vault, homeAddress: e.target.value } } : prev)
                                }
                              />
                              <Button
                                className="rounded-full mt-2"
                                onClick={async () => {
                                  if (!selectedChild) return;
                                  if (!selectedChild.vault.fullName.trim()) {
                                    alert("Child full name is required");
                                    return;
                                  }

                                  try {
                                    setLoading(true);

                                    const aggregate: VaultAggregate = {
                                      childId: selectedChild.childId,
                                      vault: {
                                        fullName: selectedChild.vault.fullName.trim(),
                                        nickname: selectedChild.vault.nickname?.trim() || undefined,
                                        dob: selectedChild.vault.dob?.trim() || undefined,
                                        idPassportNo: selectedChild.vault.idPassportNo?.trim() || undefined,
                                        homeAddress: selectedChild.vault.homeAddress?.trim() || undefined,
                                      },
                                      guardians: [],
                                      legal: undefined,
                                      medical: undefined,
                                      safety: undefined,
                                      emergencyContacts: [],
                                      documents: [],
                                    };

                                    // ✅ save and get newly created vault ID
                                    // Save and get newly created vault ID
                                    const vaultId = await vaultSaveService.saveVaultAggregate(aggregate);

                                    setCurrentStep(2);

                                    // ✅ pass vaultId so handleChildChange fetches the correct vault immediately
                                    await handleChildChange(selectedChild.childId, selectedChild.vault.fullName, vaultId);
                                  } catch (err) {
                                    console.error("Error creating vault:", err);
                                    alert("Unable to create vault. Please check required fields.");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              >
                                Create Vault
                              </Button>
                            </div>
                          </Card>
                        )}

                        {/* Step 2: Everything else */}
                        {currentStep === 2 && selectedChild && (
                          <>
                            {/* The entire existing form below (guardians, legal, medical, safety, documents, etc.) stays exactly as is */}
                          </>
                        )}

                      </div>

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
                            />
                          ) : (
                            selectedChild.vault.dob
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
                            />
                          ) : (
                            selectedChild.vault.idPassportNo
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">
                        {editMode ? (
                          <Input
                            value={selectedChild?.vault.homeAddress || ""}
                            onChange={(e) =>
                              setSelectedChild(prev => prev ? { ...prev, vault: {...prev.vault, homeAddress: e.target.value} } : prev)
                            }
                          />
                        ) : (
                          selectedChild.vault.homeAddress
                        )}
                      </p>
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
                                placeholder="Name"
                                className="mb-1"
                              />
                              <Input
                                value={g.cell}
                                onChange={(e) => {
                                  const newGuardians = [...selectedChild.guardians];
                                  newGuardians[idx].cell = e.target.value;
                                  setSelectedChild({ ...selectedChild, guardians: newGuardians });
                                }}
                                placeholder="Cell"
                                className="mb-1"
                              />
                              <Input
                                value={g.work}
                                onChange={(e) => {
                                  const newGuardians = [...selectedChild.guardians];
                                  newGuardians[idx].work = e.target.value;
                                  setSelectedChild({ ...selectedChild, guardians: newGuardians });
                                }}
                                placeholder="Work"
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
                                value={selectedChild.legal.custodyType}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    legal: { ...selectedChild.legal, custodyType: e.target.value },
                                  })
                                }
                                placeholder="Custody"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild.legal.caseNo}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    legal: { ...selectedChild.legal, caseNo: e.target.value },
                                  })
                                }
                                placeholder="Court order ref"
                                className="mb-1"
                              />
                              <Input
                                value={selectedChild.legal.validUntil}
                                onChange={(e) =>
                                  setSelectedChild({
                                    ...selectedChild,
                                    legal: { ...selectedChild.legal, validUntil: e.target.value },
                                  })
                                }
                                placeholder="Valid until"
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
                              />
                            </>
                          ) : (
                            <>
                              <table className="legal-table">
                                <tbody>
                                  <tr>
                                    <td className="legal-label">Custody Arrangement</td>
                                    <td>{selectedChild.legal.custodyType}</td>
                                  </tr>
                                  <tr>
                                    <td className="legal-label">Court Reference Number</td>
                                    <td>{selectedChild.legal.caseNo}</td>
                                  </tr>
                                  <tr>
                                    <td className="legal-label">Valid Until</td>
                                    <td>{selectedChild.legal.validUntil}</td>
                                  </tr>
                                  <tr>
                                    <td className="legal-label">Legally Restricted Persons</td>
                                    <td>{selectedChild?.legal?.contactType || ""}</td>
                                  </tr>
                                </tbody>
                              </table>
                              <p>
                                <span className="text-muted-foreground">Valid until:</span>{" "}
                                {selectedChild.legal.validUntil}
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
                                value={selectedChild.medical.bloodType}
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
                                value={selectedChild.medical.allergies}
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
                                value={selectedChild.medical.medication}
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
                                value={selectedChild.medical.doctor}
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
                                {selectedChild.medical.bloodType}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Allergies:</span>{" "}
                                {selectedChild.medical.allergies}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Medication:</span>{" "}
                                {selectedChild.medical.medication}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Doctor contact:</span>{" "}
                                {selectedChild.medical.doctor}
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
                                value={selectedChild.safety.approvedPickup}
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
                                value={selectedChild.safety.notAllowedPickup}
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
                                {selectedChild.safety.approvedPickup}
                              </p>
                              <p>
                                <span className="text-muted-foreground">NOT allowed:</span>{" "}
                                {selectedChild.safety.notAllowedPickup}
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
                                />

                                <Input
                                  value={selectedChild?.emergencyContacts?.[1]?.phone || ""}
                                  onChange={(e) => {
                                    const newContacts = [...(selectedChild?.emergencyContacts || [])];
                                    newContacts[1] = { ...newContacts[1], phone: e.target.value, name: newContacts[1]?.name || "" };
                                    setSelectedChild({ ...selectedChild!, emergencyContacts: newContacts });
                                  }}
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
                          <label className="flex items-center gap-2 px-4 py-2 bg-cub-mint-light rounded-lg cursor-pointer text-sm">
                            <Upload className="w-4 h-4 text-primary" />
                            <span>Upload files</span>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              onChange={(e) => handleFileUpload(e.target.files)}
                            />
                          </label>
                        </div>
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
                            {(selectedChild?.documents || []).map((file, idx) => {
                              const fileName = file.file?.name || file.name || "Unnamed file"; // ✅ safe
                              const fileURL = file.file ? URL.createObjectURL(file.file) : file.fileUrl;

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

                                  {fileURL && (
                                    <button
                                      className="p-1 rounded hover:bg-card/50"
                                      onClick={() => window.open(fileURL, "_blank")}
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
                            .filter(e => e.name && e.phone)
                            .map(e => ({ ...e, name: e.name.trim(), phone: e.phone.trim() })),
                          documents: selectedChild.documents.filter(d => d.name && (d.file || d.fileUrl))
                        };

                        try {
                          setLoading(true);
                          await vaultSaveService.saveVaultAggregate(selectedChild!);
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
    </div>
  );
};

export default Children;

