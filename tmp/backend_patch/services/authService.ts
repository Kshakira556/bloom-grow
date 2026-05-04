import { getUserByEmail } from "./usersService.ts";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { generateJWT } from "../utils/jwt.ts";
import { User, SafeUserResponse, toSafeUserResponse } from "../types/types.ts";

type LoginResult = {
  user: SafeUserResponse;
  token: string;
} | null;

export const login = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  const user: User | null = await getUserByEmail(email);
  if (!user) return null;

  // Block access if user has requested deletion or has been deleted/anonymised.
  if (user.deleted_at || user.deletion_requested_at) {
    throw new Error("Account is pending deletion");
  }

  console.time("bcrypt");
  const valid = await compare(password, user.password_hash);
  console.timeEnd("bcrypt");
  if (!valid) return null;

  const token = await generateJWT({ id: user.id, role: user.role, email: user.email });

  const safeUser: SafeUserResponse = toSafeUserResponse(user);

  return { user: safeUser, token };
};
