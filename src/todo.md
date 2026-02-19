## **4. Abstract Plan & Conversation Logic into Hooks**

Create hooks like:

```ts
// useConversations.ts
export const useConversations = (activePlan: FullPlan | null, user: User | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const fetchConversations = async () => { ... }
  return { conversations, selectedConversation, setSelectedConversation, fetchConversations };
}
```

Similarly, move **WebSocket message handling** into a `useMessagesWS` hook.

---

## **5. Constants & Types**

Move long type definitions and constants to separate files:

* `/types/messages.ts`
* `/constants/purposes.ts`

Example:

```ts
export const PURPOSES: MessagePurpose[] = ["All", "General", "Legal", "Medical", "Safety", "Emergency", "Financial"];
```

---

## **6. Example Folder Structure After Refactor**

```
/components/Messages/
  Banner.tsx
  ConversationSidebar.tsx
  ChatHeader.tsx
  MessageList.tsx
  MessageItem.tsx
  MessageInput.tsx

/hooks/
  useConversations.ts
  useMessagesWS.ts

/lib/
  messages.ts
  exportConversation.ts

/constants/
  purposes.ts

/types/
  messages.ts
```

After this, your `Messages.tsx` will be **~150 lines**, mainly importing components and hooks.

---

