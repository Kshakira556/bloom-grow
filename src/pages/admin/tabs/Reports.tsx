import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const reports = [
  { id: 1, title: "Flagged Messages", value: 24 },
  { id: 2, title: "Resolved Issues", value: 12 },
  { id: 3, title: "Pending Approvals", value: 2 },
];

const Reports = () => {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Reports</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{report.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
