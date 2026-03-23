export type SeedUser = {
  email: string;
  password: string;
  role: "parent" | "moderator" | "admin";
};

type SeedCredentials = {
  parent1: SeedUser;
  parent2: SeedUser;
  moderator: SeedUser;
  admin: SeedUser;
};

const defaultPassword = process.env.SEED_PASSWORD ?? "StrongPassword123!";

const seedCredentials: SeedCredentials = {
  parent1: {
    email: process.env.SEED_PARENT1_EMAIL ?? "e2e-parent1@cub.test",
    password: process.env.SEED_PARENT1_PASSWORD ?? defaultPassword,
    role: "parent",
  },
  parent2: {
    email: process.env.SEED_PARENT2_EMAIL ?? "e2e-parent2@cub.test",
    password: process.env.SEED_PARENT2_PASSWORD ?? defaultPassword,
    role: "parent",
  },
  moderator: {
    email: process.env.SEED_MODERATOR_EMAIL ?? "e2e-mediator@cub.test",
    password: process.env.SEED_MODERATOR_PASSWORD ?? defaultPassword,
    role: "moderator",
  },
  admin: {
    email: process.env.SEED_ADMIN_EMAIL ?? "e2e-admin@cub.test",
    password: process.env.SEED_ADMIN_PASSWORD ?? defaultPassword,
    role: "admin",
  },
};

export default seedCredentials;
