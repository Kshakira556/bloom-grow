import { PURPOSES } from "@/constants/purposes";
import { MessagePurpose } from "@/types/messages";
import { Conversation } from "@/lib/types";

type ChatHeaderProps = {
  selectedConversation: Conversation | null;
  purposeFilter: MessagePurpose | "All";
  setPurposeFilter: (p: MessagePurpose | "All") => void;
  exportConversation: () => void | Promise<void>;
  onBack?: () => void;
  mobileMenuButton?: React.ReactNode;
};

const ChatHeader = ({
  selectedConversation,
  purposeFilter,
  setPurposeFilter,
  exportConversation,
  onBack,
  mobileMenuButton,
}: ChatHeaderProps) => {
  return (
    <div className="border-b px-4 sm:px-6 py-3 sm:py-4 bg-muted/30">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {selectedConversation && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="md:hidden text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition"
                title="Back to conversations"
              >
                Back
              </button>
            )}
            {selectedConversation && (
              <>
                <h2 className="font-display font-bold text-lg">{selectedConversation.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {selectedConversation.role}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mobileMenuButton && <div className="md:hidden">{mobileMenuButton}</div>}
            <button
              onClick={exportConversation}
              className="hidden md:inline-flex text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
              disabled={!selectedConversation}
              title={selectedConversation ? "Export this conversation as PDF" : "Select a conversation to export"}
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-wrap gap-2 mt-1">
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

        <div className="hidden md:flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
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

        <p className="hidden md:block text-xs italic text-muted-foreground mt-2">
          This conversation is part of a structured and auditable communication
          record.
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;

