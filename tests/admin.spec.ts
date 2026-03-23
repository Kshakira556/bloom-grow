import { test, expect } from "@playwright/test";

const seedAuth = async (page: import("@playwright/test").Page, role: "admin" | "mediator") => {
  await page.addInitScript((r) => {
    const user = {
      id: r === "admin" ? "admin-1" : "mediator-1",
      full_name: r === "admin" ? "Admin User" : "Mediator User",
      email: r === "admin" ? "admin@example.com" : "mediator@example.com",
      role: r,
      phone: "1234567890",
    };
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token", "dummy-token");
  }, role);
};

const mockAdminApi = async (page: import("@playwright/test").Page) => {
  const now = new Date().toISOString();

  const users = [
    { id: "admin-1", full_name: "Admin User", email: "admin@example.com", role: "admin", phone: "111" },
    { id: "mediator-1", full_name: "Mediator User", email: "mediator@example.com", role: "mediator", phone: "222" },
    { id: "parent-1", full_name: "Parent One", email: "parent1@example.com", role: "parent", phone: "333" },
  ];

  const plans = [
    { id: "plan-1", title: "Weekend Plan", created_by: "parent-1" },
  ];

  const children = [
    { id: "child-1", first_name: "Test", last_name: "Child", birth_date: "2015-01-01", notes: "", created_at: now },
  ];

  const messages = [
    {
      id: "msg-1",
      sender_id: "parent-1",
      receiver_id: "mediator-1",
      plan_id: "plan-1",
      content: "Flagged content",
      created_at: now,
      updated_at: null,
      purpose: "General",
      is_flagged: true,
      flagged_reason: "Reason",
      is_deleted: false,
      is_seen: false,
      attachments: [],
    },
  ];

  const proposals = [
    {
      id: "proposal-1",
      plan_id: "plan-1",
      created_by: "parent-1",
      title: "Change pickup time",
      description: "Move pickup to 6pm",
      status: "pending",
      created_at: now,
      updated_at: null,
      reviewed_by: null,
      reviewed_at: null,
    },
  ];

  const reviewHistory = [
    {
      id: "review-1",
      message_id: "msg-1",
      reviewer_id: "mediator-1",
      action: "approved",
      notes: "Looks ok",
      created_at: now,
    },
  ];

  const auditLogs = [
    {
      id: "audit-1",
      actor_id: "admin-1",
      action: "login",
      target_type: "user",
      target_id: "admin-1",
      notes: "Admin login",
      created_at: now,
    },
  ];

  const moderatorAssignments = [
    { id: "assign-1", moderator_id: "mediator-1", plan_id: "plan-1", status: "active", created_at: now },
  ];

  await page.route("**/users", async (route) => {
    if (route.request().resourceType() === "document") return route.fallback();
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ users }) });
  });

  await page.route("**/plans", async (route) => {
    if (route.request().resourceType() === "document") return route.fallback();
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ plans }) });
  });

  await page.route("**/children", async (route) => {
    if (route.request().resourceType() === "document") return route.fallback();
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ children }) });
  });

  await page.route("**/messages/plan/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ messages }) });
  });

  await page.route("**/messages/history/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ history: reviewHistory }) });
  });

  await page.route("**/proposals?status=pending", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ proposals }) });
  });

  await page.route("**/proposals/*", async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ proposal: { ...proposals[0], status: "approved" } }),
    });
  });

  await page.route("**/moderation/reviews", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reviews: reviewHistory }) });
  });

  await page.route("**/api/moderation/reviews", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ review: reviewHistory[0] }),
    });
  });

  await page.route("**/admin/audit-logs", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ logs: auditLogs }) });
  });

  await page.route("**/admin/moderator-assignments", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ assignments: moderatorAssignments }) });
  });
};

test.beforeEach(async ({ page }) => {
  await mockAdminApi(page);
});

test.describe("Admin Flows", () => {
  test("Admin dashboard loads", async ({ page }) => {
    await seedAuth(page, "admin");
    await page.goto("/admin/dashboard");

    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect(page.getByText("Clients")).toBeVisible();
  });

  test("Admin system tabs render", async ({ page }) => {
    await seedAuth(page, "admin");
    await page.goto("/admin/system");

    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await page.getByRole("tab", { name: "Moderators" }).click();
    await expect(page.locator("h2", { hasText: "Moderators" })).toBeVisible();

    await page.getByRole("tab", { name: "Audit Logs" }).click();
    await expect(page.locator("h2", { hasText: "Audit Logs" })).toBeVisible();

    await page.getByRole("tab", { name: "Reports" }).click();
    await expect(page.locator("h2", { hasText: "Reports" })).toBeVisible();
  });

  test("Admin roles can be updated in Roles tab", async ({ page }) => {
    await seedAuth(page, "admin");
    await page.goto("/admin/system");

    await page.getByRole("tab", { name: "Roles & Permissions" }).click();
    await expect(page.locator("h2", { hasText: "Roles & Permissions" })).toBeVisible();

    const roleSelect = page.getByRole("combobox").first();
    await roleSelect.click();
    await page.getByRole("option", { name: "Moderator" }).click();

    await expect(page.getByText("Moderator").first()).toBeVisible();
  });

  test("Admin settings save shows confirmation alert", async ({ page }) => {
    await seedAuth(page, "admin");
    await page.goto("/admin/system");

    await page.getByRole("tab", { name: "Global Settings" }).click();
    await expect(page.locator("h2", { hasText: "Global Settings" })).toBeVisible();

    await page.getByPlaceholder("Enter system name").fill("Test System");

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Save Settings" }).click();
    expect(dialogMessage).toContain("Saved Settings:");
  });
});

test.describe("Moderator Flows", () => {
  test("Moderator dashboard loads", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/moderator");

    await expect(page.getByRole("heading", { name: "Moderation Center" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Flagged Messages" })).toBeVisible();
  });

  test("Clients page loads", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/clients");

    await expect(page.getByRole("heading", { name: "Clients" }).first()).toBeVisible();
    await expect(page.getByText("Parent One")).toBeVisible();
  });

  test("Children page loads", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/children");

    await expect(page.getByRole("heading", { name: "Children" }).first()).toBeVisible();
    await expect(page.getByText("Test Child")).toBeVisible();
  });

  test("Plans page loads", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/plans");

    await expect(page.getByRole("heading", { name: "Plans" }).first()).toBeVisible();
    await expect(page.getByText("Weekend Plan")).toBeVisible();
  });

  test("Messages page loads", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/messages");

    await expect(page.getByRole("heading", { name: "Messages" }).first()).toBeVisible();
    await expect(page.getByText("Flagged content")).toBeVisible();
  });

  test("Proposals page loads and can approve", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/proposals");

    await expect(page.getByRole("heading", { name: "Proposed Changes" })).toBeVisible();
    await expect(page.getByText("Change pickup time")).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
  });

  test("Audit page loads", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/audit");

    await expect(page.getByRole("heading", { name: "Audit / Message History" })).toBeVisible();
    await expect(page.getByText("Flagged content")).toBeVisible();
  });

  test("Audit export button is clickable", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/audit");

    const exportBtn = page.getByRole("button", { name: "Export" });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
  });

  test("Moderator can approve a flagged message", async ({ page }) => {
    await seedAuth(page, "mediator");
    await page.goto("/admin/moderator");

    await expect(page.getByRole("tab", { name: "Flagged Messages" })).toBeVisible();
    await expect(page.getByText("Flagged content")).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("No flagged messages.")).toBeVisible();
  });
});

test.describe("Admin Empty States", () => {
  test("Admin clients empty state", async ({ page }) => {
    await seedAuth(page, "mediator");

    await page.unroute("**/users");
    await page.unroute("**/plans");

    await page.route("**/users", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ users: [] }),
      });
    });

    await page.route("**/plans", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ plans: [] }),
      });
    });

    await page.goto("/admin/clients");
    await expect(page.getByText("No clients found.")).toBeVisible();
  });

  test("Admin messages empty state", async ({ page }) => {
    await seedAuth(page, "mediator");

    await page.unroute("**/messages/plan/*");
    await page.route("**/messages/plan/*", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ messages: [] }),
      });
    });

    await page.goto("/admin/messages");
    await expect(page.getByText("No messages found.")).toBeVisible();
  });

  test("Admin proposals empty state", async ({ page }) => {
    await seedAuth(page, "mediator");

    await page.unroute("**/proposals?status=pending");
    await page.route("**/proposals?status=pending", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ proposals: [] }),
      });
    });

    await page.goto("/admin/proposals");
    await expect(page.getByText("No pending proposals.")).toBeVisible();
  });

  test("Admin audit empty state", async ({ page }) => {
    await seedAuth(page, "admin");

    await page.unroute("**/admin/audit-logs");
    await page.route("**/admin/audit-logs", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ logs: [] }),
      });
    });

    await page.goto("/admin/system");
    await page.getByRole("tab", { name: "Audit Logs" }).click();
    await expect(page.getByText("No logs to display.")).toBeVisible();
  });
});
