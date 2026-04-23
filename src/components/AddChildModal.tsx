import { useState } from "react";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

interface AddChildModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const AddChildModal = ({ onClose, onCreated }: AddChildModalProps) => {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [birth_date, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!first_name.trim()) return alert("First name is required");

    try {
      setLoading(true);

      await api.createChild({
        first_name,
        last_name: last_name || undefined,
        birth_date: birth_date || undefined,
        notes: notes || undefined,
      });

      onCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create child:", err);
      alert("Failed to create child");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-xl">
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Add Child</h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="space-y-3">
          <input
            className="w-full p-2 border rounded"
            placeholder="First name"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            className="w-full p-2 border rounded"
            placeholder="Last name"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            aria-label="date"
            type="date"
            className="w-full p-2 border rounded"
            value={birth_date}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          <textarea
            className="w-full p-2 border rounded"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="w-full mt-4 rounded-full"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Create Child"}
        </Button>
      </div>
    </div>
  );
};