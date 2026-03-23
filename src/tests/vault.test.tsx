import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import Children from "@/pages/Children";
import { vaultReadService } from "@/lib/vaultReadService";
import * as api from "@/lib/api";
import { vi } from "vitest";

vi.mock("@/lib/vaultReadService");
vi.mock("@/lib/api");

const mockVaultRead = vaultReadService.getVaultAggregate as unknown as ReturnType<typeof vi.fn>;
const mockGetChildren = api.getChildren as unknown as ReturnType<typeof vi.fn>;

describe("Vault (Children Page)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders vault info when data exists", async () => {
    mockGetChildren.mockResolvedValue([
      { id: "child-1", first_name: "John", last_name: "Doe" }
    ]);

    mockVaultRead.mockResolvedValue({
      childId: "child-1",
      vaultId: "vault-1",
      vault: { fullName: "John Doe", nickname: "Johnny", dob: "2010-01-01" },
      guardians: [{ id: "g1", name: "Parent A", cell: "123", work: "456" }],
      medical: { id: "m1", bloodType: "O+", allergies: "Peanuts", medication: "None", doctor: "Dr A" },
      legal: { id: "l1", custodyType: "Joint", caseNo: "12345" },
      safety: { id: "s1", approvedPickup: "Parent B", notAllowedPickup: "Stranger" },
      emergencyContacts: [{ id: "e1", name: "Neighbor", phone: "999" }],
      documents: []
    });

    renderWithProviders(<Children />);

    expect((await screen.findAllByText(/john doe/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/johnny/i)).toBeInTheDocument();
    expect(screen.getByText(/parent a/i)).toBeInTheDocument();
    expect(screen.getByText(/peanuts/i)).toBeInTheDocument();
    expect(screen.getByText(/joint/i)).toBeInTheDocument();
  });

  test("shows placeholder when vault not found", async () => {
    mockGetChildren.mockResolvedValue([
      { id: "child-999", first_name: "Test", last_name: "Child" }
    ]);

    mockVaultRead.mockResolvedValue(null);

    renderWithProviders(<Children />);

    expect((await screen.findAllByText(/no vault exists/i)).length).toBeGreaterThan(0);
  });
});
