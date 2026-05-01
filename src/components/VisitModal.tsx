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
  onEdit: () => void;
}

export const VisitModal = ({ mode, event, onClose, onSave, onDelete, onEdit }: VisitModalProps) => {
  const [form, setForm] = useState<VisitEvent>(() => ({
    ...event,
    id: event?.id || "",
  }));

  useEffect(() => {
    if (event) {
      setForm((prev) => ({
        ...event,
        id: event.id || prev.id || "",
      }));
    }
  }, [event]);

  const isDeletedEvent = form.type === "deleted";
  const isView = mode === "view";
  const isEdit = (mode === "edit" || mode === "create") && !isDeletedEvent;
  const disableFields = isView || isDeletedEvent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-primary">
            {mode === "view" ? "View Visit" : mode === "edit" ? "Edit Visit" : "Create Visit"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-sm font-medium">Title / Notes</label>
            <input
              aria-label="title"
              type="text"
              className="w-full p-2 border rounded"
              value={form.title}
              disabled={disableFields}
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
              disabled={disableFields}
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
              disabled={disableFields}
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
              disabled={disableFields}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Type</label>
            <select aria-label="type" className="w-full p-2 border rounded" value={form.type} disabled>
              <option value="mine">My event</option>
              <option value="theirs">Their event</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <input aria-label="status" type="text" className="w-full p-2 border rounded" value={form.status} disabled />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {isEdit && (
            <Button className="w-full rounded-full" onClick={() => onSave(form)}>
              Save
            </Button>
          )}

          {isView && !isDeletedEvent && (
            <Button className="w-full rounded-full" onClick={onEdit}>
              Edit
            </Button>
          )}

          {mode !== "create" && onDelete && !isDeletedEvent && (
            <Button
              variant="destructive"
              className="w-full rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                const idToDelete = form.id;
                if (!idToDelete) {
                  console.warn("No ID found for deletion");
                  return;
                }
                if (!window.confirm("Are you sure you want to delete this visit?")) return;
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
