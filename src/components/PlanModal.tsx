import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";
import { CreatePlanPayload } from "@/lib/api";
import { useAuthContext } from "@/context/AuthContext";

// Accept simplified children objects for compatibility
interface SimpleChild {
  id: string;
  name: string;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreatePlanPayload, childIds: string[]) => Promise<void>; // <-- object now
  childrenOptions: SimpleChild[];
  onChildCreated?: (child: api.Child) => void;
}

export const PlanModal = ({ isOpen, onClose, onCreate, childrenOptions, onChildCreated }: PlanModalProps) => {
  const [title, setTitle] = useState("");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localChildrenOptions, setLocalChildrenOptions] = useState<SimpleChild[]>(childrenOptions);
  const { user } = useAuthContext();

useEffect(() => {
  const uniqueChildren = Array.from(new Map(childrenOptions.map(c => [c.id, c])).values());
  setLocalChildrenOptions(uniqueChildren);
}, [childrenOptions]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setSelectedChildren([]);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
  if (!title.trim()) {
    setError("Plan title is required.");
    return;
  }
  if (selectedChildren.length === 0) {
    setError("At least one child must be selected.");
    return;
  }

  try {
    setSubmitting(true);
    await onCreate(
      {
        title: title.trim(),
        description: "",   // or from a textarea
        start_date: undefined,
        end_date: undefined,
        status: "draft",
        created_by: user?.id ||""
      },
      selectedChildren
    );
    onClose();
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Failed to create plan.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-xl">
        <h2 className="font-display text-xl font-bold text-primary mb-4">Create Plan</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Plan Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter plan title"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="children-select" className="block text-sm font-medium">Select Children</label>
            <div className="relative">
              <select
                id="children-select"
                multiple
                value={selectedChildren}
                onChange={(e) =>
                  setSelectedChildren(Array.from(e.target.selectedOptions, (opt) => opt.value))
                }
                className="w-full p-2 border rounded h-32"
              >
                {localChildrenOptions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="absolute bottom-0 left-0 w-full py-2 text-sm text-primary bg-card hover:bg-muted border-t rounded-b-lg"
                onClick={async () => {
                  const firstName = prompt("Enter child's first name:");
                  if (!firstName?.trim()) return;

                  const lastName = prompt("Enter child's last name (optional):") || "";
                  const birthDate = prompt("Enter child's birth date (YYYY-MM-DD, optional):") || "";
                  const notes = prompt("Enter notes for child (optional):") || "";

                  try {
                    const newChild = await api.createChild({
                      first_name: firstName.trim(),
                      last_name: lastName.trim() || undefined,
                      birth_date: birthDate.trim() || undefined,
                      notes: notes.trim() || undefined,
                    });

                    onChildCreated?.(newChild);
                    const newChildObj = { 
                      id: newChild.id, 
                      name: `${newChild.first_name} ${newChild.last_name || ""}`.trim() 
                    };
                    setLocalChildrenOptions((prev) => {
                      if (prev.some(c => c.id === newChildObj.id)) return prev;
                      return [...prev, newChildObj];
                    });
                    setSelectedChildren((prev) => [...prev, newChild.id]);
                  } catch (err) {
                    console.error("Failed to create child:", err);
                    alert("Failed to create child. Please try again.");
                  }
                }}
              >
                + Create Child
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Plan"}
          </Button>
        </div>
      </div>
    </div>
  );
};
