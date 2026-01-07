import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Upload, FileText, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    { category: string; subcategory: string; file: File }[]
  >([]);

  useEffect(() => {
    if (uploadedFile && selectedCategory && selectedSubcategory) {
      setUploadedFiles(prev => [
        ...prev,
        { category: selectedCategory, subcategory: selectedSubcategory, file: uploadedFile },
      ]);
      setUploadedFile(null);
      setSelectedCategory("");
      setSelectedSubcategory("");
    }
  }, [uploadedFile, selectedCategory, selectedSubcategory]);

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
                    <h2 className="font-display font-bold text-xl mb-4">
                      {selectedChild.name} ({selectedChild.nickname})
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">DOB:</span>{" "}
                        {selectedChild.dob}
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span>{" "}
                        {selectedChild.idNo}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedChild.address}
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
                        <p className="text-sm text-muted-foreground">
                          {g.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cell: {g.cell}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Work: {g.work}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Sections Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-display font-bold mb-3">Legal</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Custody:</span>{" "}
                          {selectedChild.legal.custody}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Court order ref:
                          </span>{" "}
                          {selectedChild.legal.courtRef}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Valid until:
                          </span>{" "}
                          {selectedChild.legal.validUntil}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Names legally restricted:
                          </span>{" "}
                          {selectedChild.legal.restricted}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold mb-3">Medical</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Blood type:
                          </span>{" "}
                          {selectedChild.medical.blood}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Allergies:
                          </span>{" "}
                          {selectedChild.medical.allergies}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Medication:
                          </span>{" "}
                          {selectedChild.medical.medication}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Doctor contact:
                          </span>{" "}
                          {selectedChild.medical.doctor}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold mb-3">
                        Safety & Pick-up
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Approved pick-up persons:
                          </span>{" "}
                          {selectedChild.safety.allowed}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            NOT allowed:
                          </span>{" "}
                          {selectedChild.safety.notAllowed}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold mb-3">
                        Emergency Contacts
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Emergency 1:
                          </span>{" "}
                          {selectedChild.emergency.one}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Emergency 2:
                          </span>{" "}
                          {selectedChild.emergency.two}
                        </p>
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

                      {/* Export / Download Button */}
                      <Button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                        disabled={
                          uploadedFiles.filter(f =>
                            (!selectedCategory || f.category === selectedCategory) &&
                            (!selectedSubcategory || f.subcategory === selectedSubcategory)
                          ).length === 0
                        }
                        onClick={() => {
                          const filesToExport = uploadedFiles.filter(f =>
                            (!selectedCategory || f.category === selectedCategory) &&
                            (!selectedSubcategory || f.subcategory === selectedSubcategory)
                          );
                          // For now, just log the files; you can implement real download later
                          console.log("Exporting files:", filesToExport);
                        }}
                      >
                        <Download className="w-4 h-4" /> Export
                      </Button>
                    </div>

                    {/* Display uploaded files (view-only) */}
                    <div className="space-y-2">
                      {uploadedFiles
                        .filter(f => 
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

                            {/* Preview Button */}
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
                        ))
                      }
                      {uploadedFiles.length === 0 && (
                        <p className="text-xs text-muted-foreground">No documents uploaded.</p>
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
