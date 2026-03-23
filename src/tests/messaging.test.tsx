import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import Messages from "@/pages/Messages";
import * as api from "@/lib/api";
import { describe, test, expect, vi, beforeEach } from "vitest";

// ✅ SINGLE SOURCE OF TRUTH FOR MOCKS
const sendMock = vi.fn();
const fetchByPlanMock = vi.fn();
const mockInvite = {
  id: "invite1",
  plan_id: "plan1",
  email: "user2@test.com",
  status: "accepted" as const,
  created_at: new Date().toISOString(),
};

// ✅ MOCK HOOKS (ONLY ONCE)
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user1" },
  }),
}));

vi.mock("@/hooks/useMessages", () => ({
  useMessages: () => ({
    fetchByPlan: fetchByPlanMock,
    send: sendMock,
    markSeen: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock("@/hooks/useMessagesWS", () => ({
  useMessagesWS: vi.fn(),
}));

vi.mock("@/lib/api");

describe("Messages Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders messages after selecting conversation", async () => {
    // ✅ mock messages
    fetchByPlanMock.mockResolvedValue([
      {
        id: "m1",
        content: "Hello",
        sender_id: "user1",
        receiver_id: "user2",
        plan_id: "plan1",
        createdAt: new Date().toISOString(),
        time: "09:00",
        is_flagged: false,
        sender: "me",
        purpose: "General",
      },
      {
        id: "m2",
        content: "World",
        sender_id: "user2",
        receiver_id: "user1",
        plan_id: "plan1",
        createdAt: new Date().toISOString(),
        time: "09:01",
        is_flagged: false,
        sender: "them",
        purpose: "General",
      },
    ]);

    vi.mocked(api.getPlans).mockResolvedValue({
      plans: [{ id: "plan1", title: "Test Plan" }],
    });

    vi.mocked(api.getPlanById).mockResolvedValue({
      plan: {
        id: "plan1",
        title: "Test Plan",
        description: "Test description",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: "active",
        created_by: "user1",
        created_at: new Date().toISOString(),
        invites: [mockInvite],
      },
    });

    vi.mocked(api.getUsers).mockResolvedValue([
      {
        id: "user2",
        email: "user2@test.com",
        full_name: "User Two",
        role: "parent",
      },
    ]);
    vi.mocked(api.getContacts).mockResolvedValue([
      {
        id: "c1",
        user_id: "user1",
        linked_user_id: "user2",
        name: "user2@test.com",
        email: "user2@test.com",
        relationship: "parent",
        created_at: new Date().toISOString(),
      },
    ]);

    renderWithProviders(<Messages />);

    // 👉 select conversation
    const conversation = await screen.findByText(/user2@test.com/i);
    await userEvent.click(conversation);

    // ✅ assert messages
    expect((await screen.findAllByText(/Hello/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/World/i)).toBeInTheDocument();
  });

  test("can send a message", async () => {
    // ✅ no messages initially
    fetchByPlanMock.mockResolvedValue([]);

    // ✅ control send behavior
    sendMock.mockResolvedValue({
      id: "m3",
      content: "Test Message",
      sender_id: "user1",
      receiver_id: "user2",
      plan_id: "plan1",
      createdAt: new Date().toISOString(),
      time: "09:02",
      sender: "me",
      purpose: "General",
    });

    vi.mocked(api.getPlans).mockResolvedValue({
      plans: [{ id: "plan1", title: "Test Plan" }],
    });

    vi.mocked(api.getPlanById).mockResolvedValue({
      plan: {
        id: "plan1",
        title: "Test Plan",
        description: "Test description",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: "active",
        created_by: "user1",
        created_at: new Date().toISOString(),
        invites: [mockInvite],
      },
    });

    vi.mocked(api.getUsers).mockResolvedValue([
      {
        id: "user2",
        email: "user2@test.com",
        full_name: "User Two",
        role: "parent",
      },
    ]);
    vi.mocked(api.getContacts).mockResolvedValue([
      {
        id: "c1",
        user_id: "user1",
        linked_user_id: "user2",
        name: "user2@test.com",
        email: "user2@test.com",
        relationship: "parent",
        created_at: new Date().toISOString(),
      },
    ]);

    renderWithProviders(<Messages />);

    const conversation = await screen.findByText(/user2@test.com/i);
    await userEvent.click(conversation);

    await userEvent.type(
      screen.getByPlaceholderText(/type a message/i),
      "Test Message"
    );

    await userEvent.click(screen.getByLabelText(/send message/i));

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Test Message",
      })
    );
  });
});
