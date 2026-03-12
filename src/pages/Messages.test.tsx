import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import Messages from "./Messages";
import { useMessages } from "@/hooks/useMessages";

const mockMessages = [
  {
    id: "m1",
    sender: "me",
    sender_id: "user-a",
    receiver_id: "user-b",
    content: "Hello B",
    time: "10:00",
    createdAt: "2026-03-12T10:00:00Z",
    purpose: "General",
  },
  {
    id: "m2",
    sender: "them",
    sender_id: "user-b",
    receiver_id: "user-a",
    content: "Hi A",
    time: "10:01",
    createdAt: "2026-03-12T10:01:00Z",
    purpose: "General",
  },
  {
    id: "m3",
    sender: "me",
    sender_id: "user-a",
    receiver_id: "user-c",
    content: "Hello C",
    time: "10:02",
    createdAt: "2026-03-12T10:02:00Z",
    purpose: "General",
  },
];

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "user-a",
      full_name: "User A",
      email: "a@example.com",
      role: "parent",
    },
  }),
}));

const fetchByPlanMock = vi.fn().mockResolvedValue(mockMessages);
const sendMock = vi.fn();
const markSeenMock = vi.fn();
const updateMock = vi.fn();
const removeMock = vi.fn();

vi.mock("@/hooks/useMessages", () => ({
  useMessages: () => ({
    fetchByPlan: fetchByPlanMock,
    send: sendMock,
    markSeen: markSeenMock,
    update: updateMock,
    remove: removeMock,
  }),
}));

vi.mock("@/hooks/useMessagesWS", () => ({
  useMessagesWS: () => undefined,
}));

vi.mock("@/lib/api", () => ({
  getPlans: vi.fn().mockResolvedValue({ plans: [{ id: "plan-1", title: "Plan 1" }] }),
  getPlanById: vi.fn().mockResolvedValue({
    plan: {
      id: "plan-1",
      title: "Plan 1",
      description: "",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      status: "active",
      created_by: "user-a",
      created_at: "2026-01-01",
      invites: [],
    },
  }),
  getUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

vi.mock("@/components/ui/Banner", () => ({
  default: () => null,
}));

vi.mock("@/components/ChatHeader", () => ({
  default: () => null,
}));

vi.mock("@/components/MessageInput", () => ({
  default: () => null,
}));

vi.mock("@/components/ConversationSidebar", async () => {
  const React = await import("react");

  function MockConversationSidebar({
    setSelectedConversation,
  }: {
    setSelectedConversation: (conv: {
      user_id: string;
      plan_id: string;
      name: string;
      role: string;
      topic: string;
      caseRef: string;
      childName: string | null;
      lastMessage: string;
      time: string;
      createdAt: string;
    }) => void;
  }) {
    React.useEffect(() => {
      setSelectedConversation({
        user_id: "user-b",
        plan_id: "plan-1",
        name: "User B",
        role: "Co-Parent",
        topic: "Plan conversation",
        caseRef: "Plan 1",
        childName: null,
        lastMessage: "",
        time: "",
        createdAt: "2026-03-12T09:00:00Z",
      });
    }, [setSelectedConversation]);

    return <div data-testid="sidebar" />;
  }

  return {
    __esModule: true,
    default: MockConversationSidebar,
  };
});

vi.mock("@/components/MessageList", () => ({
  default: (props: { messages: { id: string }[] }) => (
    <div data-testid="message-list">{props.messages.map((m) => m.id).join(",")}</div>
  ),
}));

describe("Messages", () => {
  it("renders only messages for the selected conversation", async () => {
    render(<Messages />);

    const list = await screen.findByTestId("message-list");

    await waitFor(() => {
      expect(list.textContent).toBe("m1,m2");
      expect(fetchByPlanMock).toHaveBeenCalled();
    });
  });

  it("renders no messages when no conversation is selected", async () => {
    vi.doMock("@/components/ConversationSidebar", () => ({
      __esModule: true,
      default: () => <div data-testid="sidebar" />,
    }));

    render(<Messages />);

    const list = await screen.findByTestId("message-list");

    await waitFor(() => {
      expect(list.textContent).toBe("");
      expect(fetchByPlanMock).toHaveBeenCalled();
    });
  });
});
