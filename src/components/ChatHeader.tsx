import { MessagePurpose, PURPOSES } from "@/lib/constants";
import { Conversation } from "@/lib/types"; 

type ChatHeaderProps = {
  selectedConversation: Conversation | null;
  purposeFilter: MessagePurpose | "All";
  setPurposeFilter: (p: MessagePurpose | "All") => void;
  exportConversation: (format: "pdf" | "docx") => void;
};

const ChatHeader = ({
  selectedConversation,
  purposeFilter,
  setPurposeFilter,
  exportConversation,
}: ChatHeaderProps) => {
  return (
    <div className="border-b px-6 py-4 bg-muted/30">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {selectedConversation && (
              <>
                <h2 className="font-display font-bold text-lg">
                  {selectedConversation.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {selectedConversation.role}
                </span>
              </>
            )}
          </div>

          <button onClick={() => exportConversation("pdf")}>Export PDF</button>
          <button onClick={() => exportConversation("docx")}>Export DOCX</button>
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          {PURPOSES.map((p) => (
            <button
              key={p}
              onClick={() => setPurposeFilter(p)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                purposeFilter === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
          <span>
            <strong>Case:</strong> {selectedConversation?.caseRef || "-"}
          </span>

          {selectedConversation?.childName && (
            <span>
              <strong>Child:</strong> {selectedConversation.childName}
            </span>
          )}

          <span>
            <strong>Started:</strong>{" "}
            {selectedConversation
              ? new Date(selectedConversation.createdAt).toLocaleDateString()
              : "-"}
          </span>
        </div>

        <p className="text-xs italic text-muted-foreground mt-2">
          This conversation is part of a structured and auditable communication
          record.
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
