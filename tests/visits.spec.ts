import { test, expect } from "@playwright/test";

const mockVisitsApi = async (page: import("@playwright/test").Page) => {
  const now = new Date().toISOString();
  const later = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const child = {
    id: "child-1",
    first_name: "Test",
    last_name: "Child",
    birth_date: "2015-01-01",
    notes: "",
    created_at: now,
  };

  const plan = {
    id: "plan-1",
    title: "Test Plan",
    description: "",
    start_date: now,
    end_date: now,
    status: "active",
    created_by: "test-user-id",
    created_at: now,
    invites: [],
    children: [
      {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        name: `${child.first_name} ${child.last_name}`.trim(),
      },
    ],
  };

  await page.route("**/plans", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plans: [{ id: plan.id, title: plan.title }] }),
    });
  });

  await page.route("**/plans/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plan }),
    });
  });

  await page.route("**/children", async (route) => {
    if (route.request().resourceType() === "document") return route.fallback();
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ children: [child] }),
    });
  });

  await page.route("**/children/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(child),
    });
  });

  await page.route("**/visits/plan/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "visit-1",
            plan_id: plan.id,
            child_id: child.id,
            parent_id: "parent-1",
            start_time: now,
            end_time: later,
            location: "School",
            notes: "Pickup",
            status: "scheduled",
          },
        ],
      }),
    });
  });

  await page.route("**/journal/child/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        entries: [
          {
            id: "entry-1",
            plan_id: plan.id,
            child_id: child.id,
            author_id: "test-user-id",
            content: "Existing entry",
            title: "Day 1",
            mood: "😊",
            image: undefined,
            entry_date: now,
          },
        ],
      }),
    });
  });

  await page.route("**/journal", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = route.request().postDataJSON() as {
      plan_id: string;
      child_id: string;
      author_id: string;
      content: string;
      title?: string;
      mood?: string;
      image?: string;
      entry_date: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "entry-new",
        plan_id: body.plan_id,
        child_id: body.child_id,
        author_id: body.author_id,
        content: body.content,
        title: body.title ?? "",
        mood: body.mood ?? "",
        image: body.image,
        entry_date: body.entry_date,
      }),
    });
  });

  await page.route("**/contacts", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        contacts: [
          {
            id: "contact-1",
            user_id: "test-user-id",
            linked_user_id: "contact-user-1",
            name: "Co Parent",
            phone: "1234567890",
            email: "coparent@example.com",
            relationship: "Co-Parent",
            created_at: now,
            updated_at: null,
          },
        ],
      }),
    });
  });

  await page.route("**/messages/plan/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        messages: [
          {
            id: "msg-1",
            sender_id: "contact-user-1",
            receiver_id: "test-user-id",
            plan_id: plan.id,
            content: "Hello there",
            created_at: now,
            updated_at: null,
            purpose: "General",
            is_flagged: false,
            is_deleted: false,
            is_seen: false,
            attachments: [],
          },
        ],
      }),
    });
  });

  await page.route("**/messages", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = route.request().postDataJSON() as {
      sender_id: string;
      receiver_id: string;
      plan_id: string;
      content: string;
      purpose?: string;
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: {
          id: "msg-new",
          sender_id: body.sender_id,
          receiver_id: body.receiver_id,
          plan_id: body.plan_id,
          content: body.content,
          created_at: new Date().toISOString(),
          updated_at: null,
          purpose: body.purpose ?? "General",
          is_flagged: false,
          is_deleted: false,
          is_seen: false,
          attachments: [],
        },
      }),
    });
  });

  await page.route("**/vaults/*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Not found" }),
    });
  });
};

const seedAuth = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    const user = {
      id: "test-user-id",
      full_name: "Test User",
      email: "test@example.com",
      role: "parent",
    };
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token", "dummy-token");
  });
};

test.beforeEach(async ({ page }) => {
  await mockVisitsApi(page);
});

test("Visits page loads and shows calendar", async ({ page }) => {
  // 1️⃣ Pre-fill sessionStorage with user, child, and plan if missing
  await page.goto("/"); // must visit a page first to access sessionStorage
  await page.evaluate(() => {
    // User
    if (!sessionStorage.getItem("user")) {
      const user = {
        id: "test-user-id",
        full_name: "Test User",
        email: "test@example.com",
        role: "parent",
      };
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", "dummy-token");
    }

    // Child
    if (!sessionStorage.getItem("children")) {
      const children = [{ id: "child-1", first_name: "Test", last_name: "Child" }];
      sessionStorage.setItem("children", JSON.stringify(children));
    }

    // Plan
    if (!sessionStorage.getItem("plans")) {
      const plans = [
        {
          id: "plan-1",
          title: "Test Plan",
          invites: [],
          children: [{ id: "child-1", name: "Test Child" }],
        },
      ];
      sessionStorage.setItem("plans", JSON.stringify(plans));
    }
  });

  // 2️⃣ Go to Visits page
  await page.goto("/visits");

  // 3️⃣ Assertions
  await expect(page).toHaveTitle(/CUB Co-Parenting App/);
  await expect(page.locator("h1")).toHaveText("Visits");
  await expect(page.locator(".rbc-calendar")).toBeVisible();
});

test("User can select a different plan", async ({ page }) => {
  // 1️⃣ Pre-fill sessionStorage
  await page.goto("/");
  await page.evaluate(() => {
    if (!sessionStorage.getItem("user")) {
      const user = { id: "test-user-id", full_name: "Test User", email: "test@example.com", role: "parent" };
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", "dummy-token");
    }

    if (!sessionStorage.getItem("plans")) {
      const plans = [
        { id: "plan-1", title: "Test Plan 1", invites: [], children: [{ id: "child-1", name: "Test Child" }] },
        { id: "plan-2", title: "Test Plan 2", invites: [], children: [{ id: "child-1", name: "Test Child" }] },
      ];
      sessionStorage.setItem("plans", JSON.stringify(plans));
    }
  });

  // 2️⃣ Go to Visits page
  await page.goto("/visits");

  // 3️⃣ Open plans dropdown
  await page.click("#plans-button");

  const plansDropdown = page.locator("#plans-dropdown");
  await expect(plansDropdown).toBeVisible();

  // 4️⃣ Select first plan
  await plansDropdown.locator("button").first().click();

  // 5️⃣ Wait for the plan title to update in the button
  await page.waitForFunction(() => {
    const span = document.querySelector("#plans-button span");
    return span && span.textContent !== "Select Plan";
  }, {}, { timeout: 5000 }); // wait up to 5s
});

test("User can select a child", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/visits");

  const select = page.locator('select[aria-label="child"]');
  await expect(select).toBeVisible();
  await select.selectOption({ index: 0 });

  const selected = await select.inputValue();
  expect(selected).toBe("child-1");
});

test("User can open a visit modal", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/visits");

  const event = page.locator(".rbc-event").first();
  await expect(event).toBeVisible();
  await event.click();

  await expect(page.locator("text=View Visit")).toBeVisible();
});

test("User can open create visit modal", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/visits");

  const createBtn = page.locator("button.w-14.h-14");
  await expect(createBtn).toBeVisible();
  await createBtn.click();
  await expect(page.locator("text=Create Visit")).toBeVisible();
});

test("Journal page loads and shows child selector", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/journal");

  await expect(page.locator("h1")).toHaveText("My Little Journal");
  const select = page.locator('select[aria-label="Choose-Child"]');
  await expect(select).toBeVisible();
  await expect(select.locator("option")).toHaveCount(2);
});

test("User can add a journal entry", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/journal");

  const textarea = page.getByPlaceholder("Write your entry.. (autosaves as draft)");
  await expect(textarea).toBeVisible();
  await textarea.fill("New journal entry");

  const addBtn = page.getByRole("button", { name: "Add Entry" });
  await expect(addBtn).toBeEnabled();
  await addBtn.click();

  await expect(page.getByText("New journal entry")).toBeVisible();
});

test("User can open a journal entry modal", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/journal");

  const entryCard = page.getByText("Existing entry").first();
  await expect(entryCard).toBeVisible();
  await entryCard.click();

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
});

test("Messages page loads and shows contacts", async ({ page }) => {
  await seedAuth(page);

  // ✅ ADD THIS
  await page.goto("/");
  await page.evaluate(() => {
    if (!sessionStorage.getItem("plans")) {
      sessionStorage.setItem(
        "plans",
        JSON.stringify([
          {
            id: "plan-1",
            title: "Test Plan",
            invites: [],
            children: [{ id: "child-1", name: "Test Child" }],
          },
        ])
      );
    }
  });

  await page.goto("/messages");

  await expect(page.locator("h1")).toHaveText("Messages");
  await expect(page.getByText("Co Parent")).toBeVisible();
});

test("User can select a contact and see messages", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/messages");

  await page.getByText("Co Parent").click();
  await expect(page.locator("p.break-words", { hasText: "Hello there" })).toBeVisible();
});

test("User can send a message", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/messages");

  await page.getByText("Co Parent").click();

  const input = page.getByPlaceholder("Type a message...");
  await input.fill("Test message");

  const sendBtn = page.getByLabel("Send message");
  await expect(sendBtn).toBeEnabled();
  await sendBtn.click();

  await expect(page.getByText("Test message")).toBeVisible();
});

test("Children page loads and shows child selector", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/children");

  await expect(page.getByRole("heading", { name: "Vault" })).toBeVisible();
  const select = page.locator('select[aria-label="Child-Name"]');
  await expect(select).toBeVisible();
  await expect(select.locator("option")).toHaveCount(1);
});

test("Children page shows vault missing message", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/children");

  await expect(page.getByText("No vault exists for this child yet.").first()).toBeVisible();
});

test("Sign in and register pages render", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
});

test("Unauthenticated users are redirected to sign in", async ({ page }) => {
  await page.goto("/visits");
  await expect(page).toHaveURL(/\/signin/);
});

test("Parent cannot access admin routes", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/admin/system");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("Dashboard loads and shows unread messages section", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unread Messages" })).toBeVisible();
});

test("Dashboard empty state shows no upcoming visits and no unread messages", async ({ page }) => {
  await seedAuth(page);
  await page.unroute("**/plans");
  await page.unroute("**/plans/*");
  await page.unroute("**/visits/plan/*");
  await page.unroute("**/messages/plan/*");

  await page.route("**/plans", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plans: [] }),
    });
  });

  await page.goto("/dashboard");
  await expect(page.getByText("No upcoming visits")).toBeVisible();
  await expect(page.getByText("No unread messages")).toBeVisible();
});

test("Logout clears session and redirects to sign in", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/visits");

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/signin/);
});

test("Session persists across refresh", async ({ page }) => {
  await seedAuth(page);
  await page.goto("/visits");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Visits" })).toBeVisible();
});
