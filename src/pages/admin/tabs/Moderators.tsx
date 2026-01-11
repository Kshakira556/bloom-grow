import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Eye } from "lucide-react";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem
} from "@/components/ui/command";

type Moderator = {
  id: number;
  name: string;
  email: string;
  role: string;
  privileges?: string[];
};

type Parent = {
  id: number;
  name: string;
  email: string;
};

type Child = {
  id: number;
  name: string;
};

type Plan = {
  id: number;
  moderatorId: number;
  status: "active" | "pending";
  dataUsageGb: number;
  parents: [Parent, Parent];
  children: Child[];
};

const PRIVILEGES = ["View Messages", "Approve Plans", "Manage Users"];
const FUP_LIMIT_GB = 50; 

const initialModerators: Moderator[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarah.mitchell@mediator.com", role: "Family Mediator", privileges: ["View Messages", "Approve Plans"] },
  { id: 2, name: "John Doe", email: "john.doe@mediator.com", role: "Moderator", privileges: ["View Messages"] },
];

const Moderators = () => {
  const [moderators, setModerators] = useState(initialModerators);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState<Moderator | null>(null);
  const [viewModerator, setViewModerator] = useState<Moderator | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [planModerator, setPlanModerator] = useState<Moderator | null>(null);

  // temp plan building state
  const [parent1, setParent1] = useState<Parent | null>(null);
  const [parent2, setParent2] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [dataUsageGb, setDataUsageGb] = useState<number>(0);

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [moderatorToRemove, setModeratorToRemove] = useState<Moderator | null>(null);
  const [nameToDelete, setNameToDelete] = useState("");
  const [confirmRemoveModal, setConfirmRemoveModal] = useState(false);
  const [modToDelete, setModToDelete] = useState<Moderator | null>(null);

  const togglePrivilege = (priv: string) => {
    setPrivileges((prev) =>
      prev.includes(priv) ? prev.filter((p) => p !== priv) : [...prev, priv]
    );
  };

  const getModeratorUsageGb = (moderatorId: number) => {
    return plans
      .filter((p) => p.moderatorId === moderatorId)
      .reduce((sum, p) => sum + p.dataUsageGb, 0);
  };

  const getModeratorPlans = (moderatorId: number) => {
    return plans.filter((p) => p.moderatorId === moderatorId);
  };

  const addModerator = () => {
    if (!name || !email || !role) return alert("Please fill all fields");

    const newMod: Moderator = {
      id: moderators.length + 1,
      name,
      email,
      role,
      privileges,
    };

    setModerators([...moderators, newMod]);
    setName("");
    setEmail("");
    setRole("");
    setPrivileges([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Moderators</h2>

      {/* Add & Remove Buttons */}
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add New Moderator"}
        </Button>

        <Button
          variant="destructive"
          onClick={() => setShowRemoveModal(true)}
        >
          Remove Moderator
        </Button>
      </div>

      {/* Step 1: Type full name of Moderator */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Remove Moderator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Type the full name of the moderator to remove:</p>
              <Input
                placeholder="Full name"
                value={nameToDelete}
                onChange={(e) => setNameToDelete(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const mod = moderators.find((m) => m.name === nameToDelete.trim());
                    if (!mod) {
                      alert("Moderator not found!"); // could be styled later
                      return;
                    }
                    setModToDelete(mod);
                    setShowRemoveModal(false);
                    setConfirmRemoveModal(true);
                  }}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setNameToDelete("");
                    setShowRemoveModal(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Confirm deletion */}
      {confirmRemoveModal && modToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Confirm Remove</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Are you sure you want to remove <strong>{modToDelete.name}</strong>?</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setModerators(prev =>
                      prev.filter(mod => mod.id !== modToDelete.id)
                    );
                    setModToDelete(null);
                    setNameToDelete("");
                    setConfirmRemoveModal(false);
                  }}
                >
                  Yes, Remove
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setModToDelete(null);
                    setNameToDelete("");
                    setConfirmRemoveModal(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Moderator Form (conditionally rendered) */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Moderator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

            {/* Role Select */}
            <select aria-label="Role" className="border rounded p-2 w-full" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="Moderator">Moderator</option>
              <option value="Family Mediator">Family Mediator</option>
              <option value="Admin">Admin</option>
            </select>

            {/* Multi-select Privileges */}
            <Command className="border rounded">
              <CommandInput placeholder="Select Privileges" />
              <CommandList>
                <CommandEmpty>No privileges found.</CommandEmpty>
                <CommandGroup>
                  {PRIVILEGES.map((priv) => (
                    <CommandItem key={priv} onSelect={() => togglePrivilege(priv)}>
                      <input aria-label="Privileges" type="checkbox" checked={privileges.includes(priv)} readOnly className="mr-2" />
                      {priv}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            <Button onClick={addModerator}>Add Moderator</Button>
          </CardContent>
        </Card>
      )}


      {/* Active Moderators */}
      <Card>
        <CardHeader>
          <CardTitle>Active Moderators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {moderators.map((mod) => (
            <div key={mod.id} className="p-3 border rounded-xl flex justify-between items-center">
              <div>
                <p className="font-medium">{mod.name}</p>
                <p className="text-xs text-muted-foreground">{mod.email}</p>
                <p className="text-xs text-muted-foreground">{mod.role}</p>
                {mod.privileges?.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Privileges: {mod.privileges.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Plans:{" "}
                    {
                      plans.filter(
                        (p) => p.moderatorId === mod.id && p.status === "active"
                      ).length
                    }{" "}
                    Active,{" "}
                    {
                      plans.filter(
                        (p) => p.moderatorId === mod.id && p.status === "pending"
                      ).length
                    }{" "}
                    Pending
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Data Usage:{" "}
                    <span
                      className={
                        getModeratorUsageGb(mod.id) > FUP_LIMIT_GB
                          ? "text-red-500 font-medium"
                          : ""
                      }
                    >
                      {getModeratorUsageGb(mod.id)} GB
                    </span>
                  </p>

                  {getModeratorUsageGb(mod.id) > FUP_LIMIT_GB && (
                    <p className="text-xs text-red-500 font-medium">
                      ⚠ FUP limit exceeded
                    </p>
                  )}
                </>
              )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    setViewModerator(mod);
                  }}
                >
                  <Eye className="w-4 h-4" /> View
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setPlanModerator(mod);
                    setParent1(null);
                    setParent2(null);
                    setChildren([]);
                    setDataUsageGb(0);
                    setShowAddPlanModal(true);
                  }}
                >
                  Add Plan
                </Button>
              </div>
            </div>
          ))}
          {showAddPlanModal && planModerator && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <Card className="w-[420px]">
                <CardHeader>
                  <CardTitle>
                    Add Plan – {planModerator.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Parent 1 */}
                  <Input
                    placeholder="Parent 1 Name"
                    value={parent1?.name || ""}
                    onChange={(e) =>
                      setParent1({
                        id: parent1?.id || Date.now(),
                        name: e.target.value,
                        email: parent1?.email || "",
                      })
                    }
                  />
                  <Input
                    placeholder="Parent 1 Email"
                    value={parent1?.email || ""}
                    onChange={(e) =>
                      setParent1({
                        id: parent1?.id || Date.now(),
                        name: parent1?.name || "",
                        email: e.target.value,
                      })
                    }
                  />

                  {/* Parent 2 */}
                  <Input
                    placeholder="Parent 2 Name"
                    value={parent2?.name || ""}
                    onChange={(e) =>
                      setParent2({
                        id: parent2?.id || Date.now() + 1,
                        name: e.target.value,
                        email: parent2?.email || "",
                      })
                    }
                  />
                  <Input
                    placeholder="Parent 2 Email"
                    value={parent2?.email || ""}
                    onChange={(e) =>
                      setParent2({
                        id: parent2?.id || Date.now() + 1,
                        name: parent2?.name || "",
                        email: e.target.value,
                      })
                    }
                  />

                  {/* Data Usage */}
                  <Input
                    type="number"
                    min={0}
                    placeholder="Data Usage (GB)"
                    value={dataUsageGb}
                    onChange={(e) => setDataUsageGb(Number(e.target.value))}
                  />

                  {/* Children */}
                  <div className="space-y-2">

                    {children.map((child) => (
                      <Input
                        key={child.id}
                        placeholder="Child Name"
                        value={child.name}
                        onChange={(e) =>
                          setChildren((prev) =>
                            prev.map((c) =>
                              c.id === child.id ? { ...c, name: e.target.value } : c
                            )
                          )
                        }
                      />
                    ))}

                    <Button
                      variant="outline"
                      onClick={() =>
                        setChildren((prev) => [
                          ...prev,
                          { id: Date.now(), name: "" },
                        ])
                      }
                    >
                      + Add Child
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (!parent1 || !parent2) {
                          alert("Both parents are required");
                          return;
                        }

                        setPlans((prev) => [
                          ...prev,
                          {
                            id: Date.now(),
                            moderatorId: planModerator.id,
                            status: "pending",
                            dataUsageGb,
                            parents: [parent1, parent2],
                            children,
                          },
                        ]);

                        setShowAddPlanModal(false);
                      }}
                    >
                      Save Plan
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAddPlanModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {viewModerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Moderator Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p><strong>Name:</strong> {viewModerator.name}</p>
              <p><strong>Email:</strong> {viewModerator.email}</p>
              <p><strong>Role:</strong> {viewModerator.role}</p>

              <p>
                <strong>Total Data Usage:</strong>{" "}
                <span
                  className={
                    getModeratorUsageGb(viewModerator.id) > FUP_LIMIT_GB
                      ? "text-red-500 font-medium"
                      : ""
                  }
                >
                  {getModeratorUsageGb(viewModerator.id)} GB
                </span>
              </p>

              {/* Plans toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlans((prev) => !prev)}
              >
                Plans ({getModeratorPlans(viewModerator.id).length})
              </Button>

              {/* Plans list */}
              {showPlans && (
                <div className="space-y-2 border rounded-lg p-3 text-sm">
                  {getModeratorPlans(viewModerator.id).length === 0 ? (
                    <p className="text-muted-foreground">No plans added</p>
                  ) : (
                    getModeratorPlans(viewModerator.id).map((plan) => (
                      <div
                        key={plan.id}
                        className="border rounded-md p-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {plan.status} Plan
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.parents[0].name} & {plan.parents[1].name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Children: {plan.children.length}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs">
                            {plan.dataUsageGb} GB
                          </p>
                          {plan.dataUsageGb > FUP_LIMIT_GB && (
                            <p className="text-xs text-red-500">
                              ⚠ FUP
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {getModeratorUsageGb(viewModerator.id) > FUP_LIMIT_GB && (
                <p className="text-red-500 text-sm">
                  ⚠ Fair Usage Policy exceeded
                </p>
              )}

              {viewModerator.privileges?.length > 0 && (
                <p>
                  <strong>Privileges:</strong>{" "}
                  {viewModerator.privileges.join(", ")}
                </p>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setSelectedModerator(viewModerator);
                    setName(viewModerator.name);
                    setEmail(viewModerator.email);
                    setRole(viewModerator.role);
                    setPrivileges(viewModerator.privileges || []);
                    setViewModerator(null);
                  }}
                >
                  Edit
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewModerator(null);
                    setShowPlans(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Overlay with Edit */}
      {selectedModerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Moderator Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Editable fields */}
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                aria-label="Select Role"
                className="border rounded p-2 w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="Moderator">Moderator</option>
                <option value="Family Mediator">Family Mediator</option>
                <option value="Admin">Admin</option>
              </select>

              {/* Multi-select privileges */}
              <Command className="border rounded">
                <CommandInput placeholder="Select Privileges" />
                <CommandList>
                  <CommandEmpty>No privileges found.</CommandEmpty>
                  <CommandGroup>
                    {PRIVILEGES.map((priv) => (
                      <CommandItem key={priv} onSelect={() => togglePrivilege(priv)}>
                        <input
                          aria-label="Toggle Privilege"
                          type="checkbox"
                          checked={privileges.includes(priv)}
                          readOnly
                          className="mr-2"
                        />
                        {priv}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    // Update moderator
                    setModerators((mods) =>
                      mods.map((mod) =>
                        mod.id === selectedModerator.id
                          ? { ...mod, name, email, role, privileges }
                          : mod
                      )
                    );
                    setSelectedModerator(null);
                  }}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setSelectedModerator(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Moderators;
