// ViewJournalModal.tsx
import { createPortal } from "react-dom";
import { JournalEntry } from "@/types/journal";
import { useState } from "react";
import * as api from "@/lib/api";

interface ViewJournalModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const ViewJournalModal = ({
  isOpen,
  entry,
  onClose,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  onUpdate,
  onDelete
}: ViewJournalModalProps) => {
  // Move hooks to top level unconditionally
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry?.title || "");
  const [editContent, setEditContent] = useState(entry?.content || "");
  const [editMood, setEditMood] = useState(entry?.mood || "");
  const [editImage, setEditImage] = useState<string | null>(entry?.image || "");

  if (!isOpen || !entry) return null;

  const saveEdit = async () => {
    try {
        const updated = await api.updateJournalEntry(entry.id, {
            title: editTitle,
            content: editContent,
            mood: editMood,
            image: editImage || undefined, // convert null/empty string to undefined
        });

        if (!updated) throw new Error("Update failed"); // <-- handle null

        onUpdate({
            id: updated.id,
            content: updated.content,
            title: updated.title ?? "",
            mood: updated.mood ?? "",
            image: updated.image ?? undefined,
            type: entry.type, // preserve existing type
            child_id: updated.child_id,
            author_id: updated.author_id,
            entry_date: updated.entry_date,
        });

        setIsEditing(false);
    } catch (err) {
        console.error("Failed to update entry:", err);
        alert("Failed to save changes.");
    }
};

  const handleDelete = async () => {
    if (!entry) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmDelete) return;

    try {
        await api.deleteJournalEntry(entry.id);
        onDelete(entry.id);
        onClose();
    } catch (err) {
        console.error("Failed to delete entry:", err);
        alert("Failed to delete entry.");
    }
    };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose} // close when clicking backdrop
    >
      <div
        className="bg-card rounded-3xl max-w-3xl w-full mx-4 relative p-6 space-y-4"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking modal content
      >
        {/* Left Arrow */}
        {onPrev && (
          <button
            className="absolute -left-6 top-1/2 -translate-y-1/2 text-3xl disabled:opacity-30"
            disabled={disablePrev}
            onClick={onPrev}
          >
            ←
          </button>
        )}

        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 text-xl">
          ✕
        </button>

        {/* Content */}
        <div className="space-y-4">

        {/* Header Row */}
        <div className="flex justify-between items-center">
            {isEditing ? (
            <div className="flex gap-2 items-center">
                {["😊", "😢", "😴", "🤒", "😤", "🥰"].map((m) => (
                <button
                    key={m}
                    className={`text-lg p-1 rounded-full ${
                    editMood === m ? "bg-cub-blue text-white" : "hover:scale-125"
                    }`}
                    onClick={() => setEditMood(m)}
                >
                    {m}
                </button>
                ))}
            </div>
            ) : (
            entry.mood && <div className="text-2xl">{entry.mood}</div>
            )}

        <div className="flex gap-2">
            <button
                onClick={() => {
                if (!isEditing) {
                    setEditTitle(entry.title || "");
                    setEditContent(entry.content || "");
                    setEditMood(entry.mood || "");
                    setEditImage(entry.image || "");
                }
                setIsEditing(!isEditing);
                }}
                className="px-3 py-1 text-sm bg-cub-blue text-white rounded-full"
            >
                {isEditing ? "Cancel" : "Edit"}
            </button>

            {!isEditing && (
                <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-full"
                >
                Delete
                </button>
            )}
            </div>
        </div>

        {/* Title */}
        {isEditing ? (
            <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-full p-2 border"
            />
        ) : (
            entry.title && (
            <h3 className="font-display font-bold text-xl">{entry.title}</h3>
            )
        )}

        {/* Image */}
        {isEditing ? (
            <div className="flex flex-col gap-2">
            <input
                aria-label="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setEditImage(reader.result as string);
                    reader.readAsDataURL(file);
                }
                }}
            />
            {editImage && (
                <img
                src={editImage}
                alt="Preview"
                className="rounded-2xl max-h-64 w-full object-cover"
                />
            )}
            </div>
        ) : (
            entry.image && (
            <img
                src={entry.image}
                alt="Child Journal Image"
                className="rounded-2xl max-h-64 w-full object-cover"
            />
            )
        )}

        {/* Content */}
        {isEditing ? (
            <textarea
            aria-label="edit-content"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-2xl border p-2 min-h-[150px]"
            />
        ) : (
            <p className="whitespace-pre-wrap">{entry.content}</p>
        )}

        {/* Save Button */}
        {isEditing && (
            <div className="flex justify-end">
            <button
                onClick={saveEdit}
                className="px-4 py-2 bg-cub-blue text-white rounded-full"
            >
                Save
            </button>
            </div>
        )}

        </div>

        {/* Right Arrow */}
        {onNext && (
          <button
            className="absolute -right-6 top-1/2 -translate-y-1/2 text-3xl disabled:opacity-30"
            disabled={disableNext}
            onClick={onNext}
          >
            →
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ViewJournalModal;