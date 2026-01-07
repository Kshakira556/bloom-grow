import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Upload, FileText, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";

const childProfiles = [
  {
    id: 1,
    name: "Sophie Brooke",
    nickname: "Soph",
    dob: "12/03/2014",
    idNo: "1403125678081",
    address: "12 Oak Street, Cape Town",
    guardians: [
      { name: "Shakira D.", cell: "082 123 4567", work: "021 555 8899" },
      { name: "Michael B.", cell: "083 987 6543", work: "021 444 2211" },
    ],
    legal: {
      custody: "Joint",
      courtRef: "WC/FC/2022/0198",
      validUntil: "Dec 2027",
      restricted: "None",
    },
    medical: {
      blood: "O+",
      allergies: "Peanuts",
      medication: "None",
      doctor: "Dr Naidoo – 021 700 1234",
    },
    safety: {
      allowed: "Grandmother (Anne Brooke)",
      notAllowed: "—",
    },
    emergency: {
      one: "Anne Brooke – 082 555 7788",
      two: "School Office – 021 333 9090",
    },
  },
  {
    id: 2,
    name: "Baby Test",
    nickname: "Bubs",
    dob: "05/06/2022",
    idNo: "2206059876084",
    address: "Same as primary residence",
    guardians: [
      { name: "Shakira D.", cell: "082 123 4567", work: "021 555 8899" },
      { name: "—", cell: "—", work: "—" },
    ],
    legal: {
      custody: "Primary – Mother",
      courtRef: "—",
      validUntil: "—",
      restricted: "—",
    },
    medical: {
      blood: "A+",
      allergies: "None known",
      medication: "Vitamin drops",
      doctor: "Dr Pillay – 021 701 4433",
    },
    safety: {
      allowed: "Mother only",
      notAllowed: "—",
    },
    emergency: {
      one: "Shakira D. – 082 123 4567",
      two: "—",
    },
  },
  {
    id: 3,
    name: "Shakira Baby",
    nickname: "Little S",
    dob: "18/11/2020",
    idNo: "2011184567082",
    address: "12 Oak Street, Cape Town",
    guardians: [
      { name: "Shakira D.", cell: "082 123 4567", work: "021 555 8899" },
      { name: "—", cell: "—", work: "—" },
    ],
    legal: {
      custody: "Primary – Mother",
      courtRef: "—",
      validUntil: "—",
      restricted: "—",
    },
    medical: {
      blood: "B+",
      allergies: "Dairy sensitivity",
      medication: "Lactase drops",
      doctor: "Dr Smith – 021 699 7788",
    },
    safety: {
      allowed: "Grandmother",
      notAllowed: "—",
    },
    emergency: {
      one: "Anne Brooke – 082 555 7788",
      two: "Neighbour – 083 222 9911",
    },
  },
];

const Children = () => {
  const [selectedChild, setSelectedChild] = useState(childProfiles[0]);

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
  const [uploadedFiles, setUploadedFiles] = useState<
    { category: string; subcategory: string; file: File }[]
  >([]);
  const [editMode, setEditMode] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedCategory || !selectedSubcategory) return;

    const newUploads = Array.from(files).map(file => ({
      category: selectedCategory,
      subcategory: selectedSubcategory,
      file,
    }));

    setUploadedFiles(prev => [...prev, ...newUploads]);
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

  const filteredFiles = uploadedFiles.filter(
    f =>
      (!selectedCategory || f.category === selectedCategory) &&
      (!selectedSubcategory || f.subcategory === selectedSubcategory)
  );

  return (  
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">
            Vault
          </h1>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Child Profiles Sidebar */}
            <div className="lg:col-span-3 space-y-3">
              {childProfiles.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${
                    selectedChild.id === child.id
                      ? "bg-card shadow-sm"
                      : "bg-card/50 hover:bg-card"
                  }`}
                >
                  <p className="font-display font-bold">{child.name}</p>
                </button>
              ))}
              <button className="w-full p-4 rounded-2xl bg-card/50 hover:bg-card text-left flex items-center gap-2 text-muted-foreground">
                <Plus className="w-4 h-4" />
                Add profile
              </button>
            </div>

            {/* Child Details */}
            <div className="lg:col-span-9">
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="font-display font-bold text-xl">
                        {selectedChild.name} ({selectedChild.nickname})
                      </h2>
                      <button
                        className="p-2 rounded-full hover:bg-card/50"
                        onClick={() => setEditMode(!editMode)}
                        title={editMode ? "View Mode" : "Edit Mode"}
                      >
                        <Edit3 className="w-5 h-5 text-primary" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">DOB:</span>{" "}
                        {editMode ? (
                          <Input
                            value={selectedChild.dob}
                            onChange={(e) =>
                              setSelectedChild({ ...selectedChild, dob: e.target.value })
                            }
                          />
                        ) : (
                          selectedChild.dob
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span>{" "}
                        {editMode ? (
                          <Input
                            value={selectedChild.idNo}
                            onChange={(e) =>
                              setSelectedChild({ ...selectedChild, idNo: e.target.value })
                            }
                          />
                        ) : (
                          selectedChild.idNo
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2">
                      {editMode ? (
                        <Input
                          value={selectedChild.address}
                          onChange={(e) =>
                            setSelectedChild({ ...selectedChild, address: e.target.value })
                          }
                        />
                      ) : (
                        selectedChild.address
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
                              value={selectedChild.legal.custody}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  legal: { ...selectedChild.legal, custody: e.target.value },
                                })
                              }
                              placeholder="Custody"
                              className="mb-1"
                            />
                            <Input
                              value={selectedChild.legal.courtRef}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  legal: { ...selectedChild.legal, courtRef: e.target.value },
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
                              value={selectedChild.legal.restricted}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  legal: { ...selectedChild.legal, restricted: e.target.value },
                                })
                              }
                              placeholder="Names legally restricted"
                            />
                          </>
                        ) : (
                          <>
                            <p>
                              <span className="text-muted-foreground">Custody:</span>{" "}
                              {selectedChild.legal.custody}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Court order ref:</span>{" "}
                              {selectedChild.legal.courtRef}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Valid until:</span>{" "}
                              {selectedChild.legal.validUntil}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Names legally restricted:</span>{" "}
                              {selectedChild.legal.restricted}
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
                              value={selectedChild.medical.blood}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  medical: { ...selectedChild.medical, blood: e.target.value },
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
                              {selectedChild.medical.blood}
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
                              value={selectedChild.safety.allowed}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  safety: { ...selectedChild.safety, allowed: e.target.value },
                                })
                              }
                              placeholder="Approved pick-up persons"
                              className="mb-1"
                            />
                            <Input
                              value={selectedChild.safety.notAllowed}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  safety: { ...selectedChild.safety, notAllowed: e.target.value },
                                })
                              }
                              placeholder="Not allowed persons"
                            />
                          </>
                        ) : (
                          <>
                            <p>
                              <span className="text-muted-foreground">Approved pick-up persons:</span>{" "}
                              {selectedChild.safety.allowed}
                            </p>
                            <p>
                              <span className="text-muted-foreground">NOT allowed:</span>{" "}
                              {selectedChild.safety.notAllowed}
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
                              value={selectedChild.emergency.one}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  emergency: { ...selectedChild.emergency, one: e.target.value },
                                })
                              }
                              placeholder="Emergency contact 1"
                              className="mb-1"
                            />
                            <Input
                              value={selectedChild.emergency.two}
                              onChange={(e) =>
                                setSelectedChild({
                                  ...selectedChild,
                                  emergency: { ...selectedChild.emergency, two: e.target.value },
                                })
                              }
                              placeholder="Emergency contact 2"
                            />
                          </>
                        ) : (
                          <>
                            <p>
                              <span className="text-muted-foreground">Emergency 1:</span>{" "}
                              {selectedChild.emergency.one}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Emergency 2:</span>{" "}
                              {selectedChild.emergency.two}
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

                      {/* Upload / Export conditional */}
                      {editMode ? (
                        <label className="flex items-center gap-2 px-4 py-2 bg-cub-mint-light rounded-lg cursor-pointer text-sm">
                          <Upload className="w-4 h-4 text-primary" />
                          <span>
                            {uploadedFiles.filter(
                              f => f.category === selectedCategory && f.subcategory === selectedSubcategory
                            ).length > 0
                              ? `${uploadedFiles.filter(
                                  f => f.category === selectedCategory && f.subcategory === selectedSubcategory
                                ).length} file(s) uploaded`
                              : "Upload files"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />

                        </label>
                      ) : (
                        <Button
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                          disabled={filteredFiles.length === 0}
                          onClick={() => downloadFiles(filteredFiles)}
                        >
                          <Download className="w-4 h-4" /> Download
                        </Button>
                      )}
                    </div>

                    {/* Display uploaded files */}
                    <div className="space-y-2">
                      {editMode ? (
                        <>

                          {/* Show files already uploaded */}
                          {uploadedFiles
                            .filter(
                              (f) =>
                                (!selectedCategory || f.category === selectedCategory) &&
                                (!selectedSubcategory || f.subcategory === selectedSubcategory)
                            )
                            .map((file, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-cub-mint-light rounded-xl flex items-center gap-2 text-xs"
                              >
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="flex-1">{file.category} → {file.subcategory}: {file.file.name}</span>
                              </div>
                            ))}
                        </>
                      ) : (
                        <>
                          {uploadedFiles
                            .filter(
                              (f) =>
                                (!selectedCategory || f.category === selectedCategory) &&
                                (!selectedSubcategory || f.subcategory === selectedSubcategory)
                            )
                            .map((file, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-cub-mint-light rounded-xl flex items-center gap-2 text-xs"
                              >
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="flex-1">{file.category} → {file.subcategory}: {file.file.name}</span>
                                <button
                                  className="p-1 rounded hover:bg-card/50"
                                  onClick={() => {
                                    const fileURL = URL.createObjectURL(file.file);
                                    window.open(fileURL, "_blank");
                                  }}
                                  title="Preview document"
                                >
                                  <Eye className="w-4 h-4 text-primary" />
                                </button>
                              </div>
                            ))}
                          {uploadedFiles.length === 0 && (
                            <p className="text-xs text-muted-foreground">No documents uploaded.</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                    <Button className="w-full rounded-full">
                      Export to PDF
                    </Button>
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
