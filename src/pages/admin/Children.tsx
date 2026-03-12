import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, User } from "lucide-react";
import * as api from "@/lib/api";

const AdminChildren = () => {
  const [search, setSearch] = useState("");
  const [children, setChildren] = useState<api.Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getChildren();
        setChildren(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load children");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredChildren = useMemo(() => {
    return children.filter((child) =>
      search
        ? `${child.first_name ?? ""} ${child.last_name ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    );
  }, [children, search]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Children
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Child List</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name..."
              className="mb-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading children...</p>
              ) : filteredChildren.length > 0 ? (
                filteredChildren.map((child) => (
                  <div key={child.id} className="p-3 border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {child.first_name} {child.last_name ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DOB: {child.birth_date ? new Date(child.birth_date).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No children found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminChildren;
