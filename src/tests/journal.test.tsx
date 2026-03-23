import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import Journal from "@/pages/Journal";
import * as api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { vi } from "vitest";

vi.mock("@/lib/api");
vi.mock("@/hooks/useAuth");

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

describe("Journal Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupBaseMocks = () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user1" },
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    mockApi.getPlans.mockResolvedValue({
      plans: [{ id: "plan1" }],
    });

    mockApi.getPlanById.mockResolvedValue({
      plan: {
        id: "plan1",
        children: [{ id: "child1", name: "John Doe" }],
      },
    });

    mockApi.getChildren.mockResolvedValue([
      { id: "child1", first_name: "John", last_name: "Doe" },
    ]);
  };

  test("renders existing journal entries", async () => {
    setupBaseMocks();

    mockApi.getJournalEntriesByChild.mockResolvedValue([
      {
        id: "1",
        content: "Entry 1",
        plan_id: "plan1",
        child_id: "child1",
        author_id: "user1",
        entry_date: "2026-03-17",
      },
      {
        id: "2",
        content: "Entry 2",
        plan_id: "plan1",
        child_id: "child1",
        author_id: "user1",
        entry_date: "2026-03-16",
      },
    ]);

    renderWithProviders(<Journal />);

    expect(await screen.findByText(/entry 1/i)).toBeInTheDocument();
    expect(screen.getByText(/entry 2/i)).toBeInTheDocument();
  });

  test("can create new journal entry", async () => {
    setupBaseMocks();

    const createMock = vi.fn().mockResolvedValue({
      id: "3",
      content: "New Entry",
      plan_id: "plan1",
      child_id: "child1",
      author_id: "user1",
      entry_date: "2026-03-17",
    });

    mockApi.getJournalEntriesByChild.mockResolvedValue([]);
    mockApi.createJournalEntry = createMock;

    renderWithProviders(<Journal />);

    await userEvent.type(
      screen.getByPlaceholderText(/write your entry/i),
      "New Entry"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /add entry/i })
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "New Entry",
      })
    );
  });
});