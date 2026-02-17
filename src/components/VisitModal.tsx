import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DateTime } from "luxon";
import type { VisitEvent } from "@/types/visits";

interface VisitModalProps {
  mode: "view" | "edit" | "create";
  event: VisitEvent;
  onClose: () => void;
  onSave: (event: VisitEvent) => void;
  onDelete?: (id: string) => void;
}

export const VisitModal = ({ mode, event, onClose, onSave, onDelete }: VisitModalProps) => {
  const [internalMode, setInternalMode] = useState(mode); // local mode state
  const [form, setForm] = useState(event);

  // Initialize internalMode and form
    useEffect(() => {
    setInternalMode(mode);
    setForm(event);
    }, [event, mode]);

    // Reset form whenever switching to edit mode
    useEffect(() => {
    if (internalMode === "edit") {
        setForm(event); // refresh form with latest event
    }
    }, [internalMode, event]);

  const isView = internalMode === "view";
  const isEdit = internalMode === "edit" || internalMode === "create";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-primary">
            {internalMode === "view"
              ? "View Visit"
              : internalMode === "edit"
              ? "Edit Visit"
              : "Create Visit"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
        </div>

        {/* Form */}
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-sm font-medium">Title / Notes</label>
            <input
              aria-label="title"
              type="text"
              className="w-full p-2 border rounded"
              value={form.title}
              disabled={isView}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              aria-label="start-time"
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={DateTime.fromISO(form.start_time).toISO({ suppressSeconds: true, includeOffset: false })}
              disabled={isView}
              onChange={(e) => setForm({ ...form, start_time: DateTime.fromISO(e.target.value).toISO() })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              aria-label="end-time"
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={DateTime.fromISO(form.end_time).toISO({ suppressSeconds: true, includeOffset: false })}
              disabled={isView}
              onChange={(e) => setForm({ ...form, end_time: DateTime.fromISO(e.target.value).toISO() })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              aria-label="location"
              type="text"
              className="w-full p-2 border rounded"
              value={form.location}
              disabled={isView}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              aria-label="type"
              className="w-full p-2 border rounded"
              value={form.type}
              disabled={isView}
              onChange={(e) => setForm({ ...form, type: e.target.value as VisitEvent["type"] })}
            >
              <option value="mine">My event</option>
              <option value="theirs">Their event</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <input
              aria-label="status"
              type="text"
              className="w-full p-2 border rounded"
              value={form.status}
              disabled
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          {isEdit && (
            <Button
              className="w-full rounded-full"
              onClick={() => {
                onSave(form);
                setInternalMode("view");
              }}
            >
              Save
            </Button>
          )}

          {isView && (
            <Button
              className="w-full rounded-full"
              onClick={() => setInternalMode("edit")}
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
                variant="destructive"
                className="w-full rounded-full"
                onClick={() => {
                const idToDelete = form.id || event.id; // fallback to original event id
                if (!idToDelete) return; 
                if (!confirm("Are you sure you want to delete this visit?")) return;
                onDelete(idToDelete);
                }}
            >
                Delete
            </Button>
            )}
        </div>
      </div>
    </div>
  );
};
