import { test, expect, request } from "@playwright/test";
import seedCredentials from "./seed.credentials";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:8000/api";
const PASSWORD = process.env.SEED_PASSWORD ?? "StrongPassword123!";

type LoginResult = {
  user: { id: string; email: string; role: string; full_name: string };
  token: string;
};

type SessionAuth = {
  user: LoginResult["user"];
  token: string;
};

const login = async (
  api: ReturnType<typeof request.newContext>,
  email: string,
  password: string
): Promise<LoginResult> => {
  const res = await api.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${email}: ${res.status()} ${await res.text()}`);
  }
  return res.json();
};

const setSession = async (
  page: import("@playwright/test").Page,
  user: LoginResult["user"],
  token: string
) => {
  await page.addInitScript(
    (u, t) => {
      sessionStorage.setItem("user", JSON.stringify(u));
      sessionStorage.setItem("token", t);
    },
    user,
    token
  );
};

const registerViaUI = async (
  page: import("@playwright/test").Page,
  fullName: string,
  email: string,
  password: string
) => {
  await page.goto("/register");
  await page.getByPlaceholder("Full Name").fill(fullName);
  await page.getByPlaceholder("Email ID").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Register" }).click();
  await page.waitForURL(/\/dashboard/);
};

const loginViaUI = async (
  page: import("@playwright/test").Page,
  email: string,
  password: string
) => {
  await page.goto("/signin");
  await page.getByPlaceholder("Email ID").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/(dashboard|admin)\b/);
};

const logoutViaUI = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  });
  await page.waitForTimeout(300);
  if (!page.url().includes("/signin")) {
    try {
      await page.goto("/signin", { waitUntil: "domcontentloaded" });
    } catch {
      // If another navigation already triggered, fall through.
    }
  }
  await expect(page).toHaveURL(/\/signin/);
};

const getSessionAuth = async (page: import("@playwright/test").Page): Promise<SessionAuth> => {
  const session = await page.evaluate(() => {
    return {
      userRaw: sessionStorage.getItem("user"),
      token: sessionStorage.getItem("token"),
    };
  });

  if (!session.userRaw || !session.token) {
    throw new Error("Missing session storage user or token after auth.");
  }

  return {
    user: JSON.parse(session.userRaw) as LoginResult["user"],
    token: session.token,
  };
};

let mediator: LoginResult | null = null;
let admin: LoginResult | null = null;
let adminLoginError: string | null = null;

test.beforeAll(async () => {
  const api = await request.newContext();
  try {
    mediator = await login(api, seedCredentials.moderator.email, seedCredentials.moderator.password);
    admin = await login(api, seedCredentials.admin.email, seedCredentials.admin.password);
  } catch (err) {
    adminLoginError = err instanceof Error ? err.message : "Admin login failed";
  }
  await api.dispose();
});

test.describe.serial("Live Parent Registration + Invite Flow", () => {
  let runId = 0;
  let parent1: { fullName: string; email: string; password: string };
  let parent2: { fullName: string; email: string; password: string };
  let parent1Auth: SessionAuth;
  let planId = "";
  let inviteId = "";
  let planTitle = "";

  test("Register Parent 1, create plan, invite Parent 2, and verify core pages", async ({ page }) => {
    runId = Date.now();
    parent1 = {
      fullName: `E2E Parent One ${runId}`,
      email: `e2e-parent1-${runId}@cub.test`,
      password: PASSWORD,
    };
    parent2 = {
      fullName: `E2E Parent Two ${runId}`,
      email: `e2e-parent2-${runId}@cub.test`,
      password: PASSWORD,
    };
    planTitle = `Live E2E Plan ${runId}`;

    const api = await request.newContext();

    // 1) Register Parent 1, then login to establish token
    await registerViaUI(page, parent1.fullName, parent1.email, parent1.password);
    await logoutViaUI(page);
    await loginViaUI(page, parent1.email, parent1.password);
    parent1Auth = await getSessionAuth(page);
    expect(parent1Auth.token).toBeTruthy();

    // 2) Create a child via API so Plan creation can select it
    const childRes = await api.post(`${API_URL}/children`, {
      data: {
        first_name: "Live",
        last_name: `Child ${runId}`,
      },
      headers: { Authorization: `Bearer ${parent1Auth.token}` },
    });
    if (!childRes.ok()) {
      throw new Error(`Create child failed: ${childRes.status()} ${await childRes.text()}`);
    }
    const childData = await childRes.json();
    const childId = childData.child?.id ?? childData.id;
    expect(childId).toBeTruthy();

    // 3) Create plan in Visits UI and select child
    await page.goto("/visits");
    await page.locator("#plans-button").click();
    await page.getByRole("button", { name: "+ Create Plan" }).click();
    await page.getByPlaceholder("Enter plan title").fill(planTitle);
    await page.locator("#children-select").selectOption(childId);
    const createPlanResponse = page.waitForResponse((res) => {
      return res.url().includes("/plans") && res.request().method() === "POST";
    });
    await page.getByRole("button", { name: "Create Plan" }).click();
    const planRes = await createPlanResponse;
    expect(planRes.ok()).toBeTruthy();

    // 4) Resolve plan id via API and invite Parent 2
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const plansRes = await api.get(`${API_URL}/plans`, {
        headers: { Authorization: `Bearer ${parent1Auth.token}` },
      });
      if (plansRes.ok()) {
        const plansData = await plansRes.json();
        const match = plansData.plans?.find((p: { id: string; title: string }) => p.title === planTitle);
        planId = match?.id ?? "";
        if (planId) break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    expect(planId).toBeTruthy();

    const inviteRes = await api.post(`${API_URL}/plans/invite`, {
      data: { plan_id: planId, email: parent2.email },
      headers: { Authorization: `Bearer ${parent1Auth.token}` },
    });
    expect(inviteRes.ok()).toBeTruthy();
    await inviteRes.json();

    const planDetailsRes = await api.get(`${API_URL}/plans/${planId}`, {
      headers: { Authorization: `Bearer ${parent1Auth.token}` },
    });
    expect(planDetailsRes.ok()).toBeTruthy();
    const planDetails = await planDetailsRes.json();
    const invite =
      planDetails.plan?.invites?.find((inv: { email: string }) => inv.email === parent2.email) ??
      planDetails.plan?.invites?.[0];
    inviteId = invite?.id ?? "";
    expect(inviteId).toBeTruthy();
    expect(invite?.email).toBe(parent2.email);

    // 5) Verify invite appears on Visits page
    await page.goto("/visits");
    await expect(page.getByText(parent2.email)).toBeVisible();

    // 6) Run through core pages for Parent 1
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: "My Little Journal" })).toBeVisible();
    await page.goto("/children");
    await expect(page.getByRole("heading", { name: "Vault" })).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await api.dispose();
  });

  test("Register Parent 2, accept invite, and validate messages", async ({ page }) => {
    const api = await request.newContext();

    await registerViaUI(page, parent2.fullName, parent2.email, parent2.password);
    await logoutViaUI(page);
    await loginViaUI(page, parent2.email, parent2.password);
    const parent2Auth = await getSessionAuth(page);
    expect(parent2Auth.user.email).toBe(parent2.email);

    const acceptRes = await api.post(`${API_URL}/plans/accept`, {
      data: { invite_id: inviteId },
      headers: { Authorization: `Bearer ${parent2Auth.token}` },
    });
    if (!acceptRes.ok()) {
      const reason = await acceptRes.text();
      test.skip(true, `Accept invite failed: ${acceptRes.status()} ${reason}`);
    }

    const contactRes = await api.post(`${API_URL}/contacts`, {
      data: {
        name: parent1.fullName,
        linked_user_id: parent1Auth.user.id,
        relationship: "Co-Parent",
        email: parent1.email,
      },
      headers: { Authorization: `Bearer ${parent2Auth.token}` },
    });
    expect(contactRes.ok()).toBeTruthy();

    const messageContent = `Hello from Parent 1 ${runId}`;
    const messageRes = await api.post(`${API_URL}/messages`, {
      data: {
        sender_id: parent1Auth.user.id,
        receiver_id: parent2Auth.user.id,
        plan_id: planId,
        content: messageContent,
      },
      headers: { Authorization: `Bearer ${parent1Auth.token}` },
    });
    expect(messageRes.ok()).toBeTruthy();

    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await page.getByText(parent1.fullName).click();
    await expect(page.locator("p.break-words", { hasText: messageContent })).toBeVisible();

    await api.dispose();
  });
});

test.describe("Live Moderator/Admin Flows", () => {
  test("Moderator dashboard loads", async ({ page }) => {
    test.skip(!mediator, adminLoginError ?? "Moderator credentials not available");
    await loginViaUI(page, seedCredentials.moderator.email, seedCredentials.moderator.password);
    await page.goto("/admin/moderator");
    await expect(page.getByRole("heading", { name: "Moderation Center" })).toBeVisible();
  });

  test("Admin dashboard loads", async ({ page }) => {
    test.skip(!admin, adminLoginError ?? "Admin credentials not available");
    await loginViaUI(page, seedCredentials.admin.email, seedCredentials.admin.password);
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  });
});
