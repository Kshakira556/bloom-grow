import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModeratorsStore } from "../store/useModeratorsStore";

/**
 * Role → Privileges mapping
 * (Optional enhancement, but clean and scalable)
 */
const ROLE_PRIVILEGES: Record<string, string[]> = {
  Admin: ["Manage Users", "Approve Plans", "View Messages"],
  Moderator: ["View Messages"],
  "Family Mediator": ["View Messages", "Approve Plans"],
};

const AVAILABLE_ROLES = ["Moderator", "Family Mediator", "Admin"];

const Roles = () => {
  const { moderators, setModerators } = useModeratorsStore();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Roles & Permissions</h2>

      <Card>
        <CardHeader>
          <CardTitle>Moderators & Roles</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {moderators.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <p className="font-medium">{mod.name}</p>
                <p className="text-xs text-muted-foreground">{mod.email}</p>

                {/* Live-updating Role */}
                {mod.role && (
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">Role:</span>{" "}
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {mod.role}
                    </span>
                  </p>
                )}
              </div>


              <Select
                value={mod.role || ""}
                onValueChange={(newRole) => {
                  setModerators((prev) =>
                    prev.map((m) =>
                      m.id === mod.id
                        ? {
                            ...m,
                            role: newRole,
                            privileges: ROLE_PRIVILEGES[newRole] || [],
                          }
                        : m
                    )
                  );
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Assign role" />
                </SelectTrigger>

                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;
