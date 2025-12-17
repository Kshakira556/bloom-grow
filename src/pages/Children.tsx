import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Upload, FileText, Download } from "lucide-react";
import { useState } from "react";

const childProfiles = [
  { id: 1, name: "Sophie Brooke", nickname: "Soph", dob: "12/03/04", idNo: "1234567890123" },
  { id: 2, name: "Baby Test", nickname: "", dob: "", idNo: "" },
  { id: 3, name: "Shakira Baby", nickname: "", dob: "", idNo: "" },
];

const Children = () => {
  const [selectedChild, setSelectedChild] = useState(childProfiles[0]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">Vault</h1>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Child Profiles Sidebar */}
            <div className="lg:col-span-3 space-y-3">
              {childProfiles.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${
                    selectedChild.id === child.id ? "bg-card shadow-sm" : "bg-card/50 hover:bg-card"
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
                    <h2 className="font-display font-bold text-xl mb-4">{selectedChild.name} ({selectedChild.nickname || 'No nickname'})</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">DOB:</span> {selectedChild.dob || 'Not set'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span> {selectedChild.idNo || 'Not set'}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Address here</p>
                  </div>

                  {/* Guardian Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-cub-mint-light rounded-2xl">
                      <p className="font-display font-bold mb-2">Guardian 1</p>
                      <p className="text-sm text-muted-foreground">Cellphone number here</p>
                      <p className="text-sm text-muted-foreground">Work phone number here</p>
                    </div>
                    <div className="p-4 bg-cub-mint-light rounded-2xl">
                      <p className="font-display font-bold mb-2">Guardian 2</p>
                      <p className="text-sm text-muted-foreground">Cellphone number here</p>
                      <p className="text-sm text-muted-foreground">Work phone number here</p>
                    </div>
                  </div>

                  {/* Sections Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Legal */}
                    <div>
                      <h3 className="font-display font-bold mb-3">Legal</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Custody:</span> Joint</p>
                        <p><span className="text-muted-foreground">Court order ref:</span> —</p>
                        <p><span className="text-muted-foreground">Valid until:</span> —</p>
                        <p><span className="text-muted-foreground">Names legally restricted:</span> —</p>
                      </div>
                    </div>

                    {/* Medical */}
                    <div>
                      <h3 className="font-display font-bold mb-3">Medical</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Blood type:</span> —</p>
                        <p><span className="text-muted-foreground">Allergies:</span> —</p>
                        <p><span className="text-muted-foreground">Medication:</span> —</p>
                        <p><span className="text-muted-foreground">Doctor contact:</span> —</p>
                      </div>
                    </div>

                    {/* Safety */}
                    <div>
                      <h3 className="font-display font-bold mb-3">Safety & Pick-up</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Approved pick-up persons:</span> —</p>
                        <p><span className="text-muted-foreground">Persons NOT allowed to pick-up:</span> —</p>
                      </div>
                    </div>

                    {/* Emergency */}
                    <div>
                      <h3 className="font-display font-bold mb-3">Emergency Contacts</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Emergency 1:</span> —</p>
                        <p><span className="text-muted-foreground">Emergency 2:</span> —</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="font-display font-bold mb-3">Confidential Legal Documents</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-3 bg-cub-mint-light rounded-xl flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-xs truncate">Document {i}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full rounded-full">Export to PDF</Button>
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
