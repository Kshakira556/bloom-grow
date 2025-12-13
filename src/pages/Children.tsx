import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Plus,
  FileText,
  Download,
  Calendar,
  Heart,
  Pill,
  GraduationCap,
  Shield,
  Upload,
  Folder,
  Image,
  File,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const children = [
  {
    id: 1,
    name: "Emma",
    age: "6 years",
    birthday: "March 15, 2018",
    avatar: "E",
    color: "coral",
    allergies: ["Peanuts"],
    medications: [],
    school: "Lincoln Elementary",
    grade: "1st Grade",
    doctor: "Dr. Sarah Wilson",
    dentist: "Dr. Mark Chen",
  },
  {
    id: 2,
    name: "Liam",
    age: "18 months",
    birthday: "July 22, 2023",
    avatar: "L",
    color: "sky",
    allergies: [],
    medications: ["Vitamin D drops"],
    school: "N/A",
    grade: "N/A",
    doctor: "Dr. Sarah Wilson",
    dentist: "N/A",
  },
];

const documents = [
  {
    id: 1,
    name: "Birth Certificate - Emma",
    type: "pdf",
    child: "Emma",
    uploadedBy: "Mom",
    date: "Jan 10, 2024",
    size: "2.3 MB",
  },
  {
    id: 2,
    name: "Vaccination Records - Liam",
    type: "pdf",
    child: "Liam",
    uploadedBy: "Dad",
    date: "Jan 8, 2024",
    size: "1.1 MB",
  },
  {
    id: 3,
    name: "School Registration - Emma",
    type: "pdf",
    child: "Emma",
    uploadedBy: "Mom",
    date: "Aug 15, 2023",
    size: "856 KB",
  },
  {
    id: 4,
    name: "Passport Photos",
    type: "image",
    child: "Both",
    uploadedBy: "Dad",
    date: "Dec 20, 2023",
    size: "4.2 MB",
  },
];

const Children = () => {
  return (
    <DashboardLayout>
      <Tabs defaultValue="profiles" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="profiles" className="gap-2">
              <Users className="w-4 h-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="vault" className="gap-2">
              <Folder className="w-4 h-4" />
              Document Vault
            </TabsTrigger>
          </TabsList>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Child
          </Button>
        </div>

        {/* Profiles Tab */}
        <TabsContent value="profiles">
          <div className="grid md:grid-cols-2 gap-6">
            {children.map((child) => (
              <Card key={child.id} className="overflow-hidden">
                <div className={`h-2 ${child.color === "coral" ? "bg-cub-coral" : "bg-cub-sky"}`} />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      child.color === "coral" ? "bg-cub-coral-light" : "bg-cub-sky-light"
                    }`}>
                      <span className={`font-display font-bold text-2xl ${
                        child.color === "coral" ? "text-cub-coral" : "text-cub-sky"
                      }`}>
                        {child.avatar}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl">{child.name}</h2>
                      <p className="text-muted-foreground">{child.age}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {child.birthday}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Health Info */}
                    <div className="space-y-3">
                      <h3 className="font-display font-bold text-sm flex items-center gap-2">
                        <Heart className="w-4 h-4 text-cub-coral" />
                        Health
                      </h3>
                      <div className="space-y-2">
                        <div className="p-3 bg-secondary rounded-xl">
                          <p className="text-xs text-muted-foreground">Allergies</p>
                          <p className="text-sm font-medium">
                            {child.allergies.length > 0 
                              ? child.allergies.join(", ") 
                              : "None known"}
                          </p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl">
                          <p className="text-xs text-muted-foreground">Medications</p>
                          <p className="text-sm font-medium">
                            {child.medications.length > 0 
                              ? child.medications.join(", ") 
                              : "None"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* School Info */}
                    <div className="space-y-3">
                      <h3 className="font-display font-bold text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-cub-sage" />
                        Education
                      </h3>
                      <div className="space-y-2">
                        <div className="p-3 bg-secondary rounded-xl">
                          <p className="text-xs text-muted-foreground">School</p>
                          <p className="text-sm font-medium">{child.school}</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl">
                          <p className="text-xs text-muted-foreground">Grade</p>
                          <p className="text-sm font-medium">{child.grade}</p>
                        </div>
                      </div>
                    </div>

                    {/* Medical Providers */}
                    <div className="col-span-2 space-y-3">
                      <h3 className="font-display font-bold text-sm flex items-center gap-2">
                        <Pill className="w-4 h-4 text-cub-lavender" />
                        Medical Providers
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-secondary rounded-xl">
                          <p className="text-xs text-muted-foreground">Pediatrician</p>
                          <p className="text-sm font-medium">{child.doctor}</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl">
                          <p className="text-xs text-muted-foreground">Dentist</p>
                          <p className="text-sm font-medium">{child.dentist}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Journal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Document Vault Tab */}
        <TabsContent value="vault">
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Secure Document Vault
                  </CardTitle>
                  <Button size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          doc.type === "pdf" ? "bg-cub-coral-light" : "bg-cub-sky-light"
                        }`}>
                          {doc.type === "pdf" ? (
                            <File className={`w-6 h-6 text-cub-coral`} />
                          ) : (
                            <Image className={`w-6 h-6 text-cub-sky`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-display font-bold">{doc.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{doc.child}</span>
                            <span>•</span>
                            <span>Uploaded by {doc.uploadedBy}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{doc.size}</span>
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              {/* Quick Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Drop files here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Used</span>
                        <span className="text-muted-foreground">8.4 MB / 1 GB</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-[1%] bg-primary rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cub-coral" />
                          Documents
                        </span>
                        <span className="text-muted-foreground">4.2 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-cub-sky" />
                          Images
                        </span>
                        <span className="text-muted-foreground">4.2 MB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Children;
