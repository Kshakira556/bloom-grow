import db from "../db/index.ts";
import { z } from "npm:zod";

export type Vault = {
  id: string;
  child_id: string;
  full_name: string;
  nickname?: string;
  dob?: string;
  id_passport_no?: string;
  home_address?: string;
  created_at: string;
  updated_at?: string;
};

export const VaultSchema = z.object({
  child_id: z.string(),
  full_name: z.string(),
  nickname: z.string().optional(),
  dob: z.string().optional(),
  id_passport_no: z.string().optional(),
  home_address: z.string().optional(),
});

export const createVault = async (vaultData: z.infer<typeof VaultSchema>): Promise<Vault> => {
  const vault = VaultSchema.parse(vaultData);

  const existing = await db.queryObject<{ id: string }>`
    SELECT id
    FROM vaults
    WHERE child_id = ${vault.child_id}
      AND deleted_at IS NULL
    LIMIT 1;
  `;

  if (existing.rows.length > 0) {
    throw new Error("Vault already exists for this child");
  }

  const result = await db.queryObject<Vault>`
    INSERT INTO vaults
      (child_id, full_name, nickname, dob, id_passport_no, home_address, created_at)
    VALUES
      (${vault.child_id}, ${vault.full_name}, ${vault.nickname}, ${vault.dob}, ${vault.id_passport_no}, ${vault.home_address}, NOW())
    RETURNING *;
  `;
  
  if (!result.rows[0]) throw new Error("Failed to create vault");
  return result.rows[0];
};


export const getVaultByChild = async (childId: string): Promise<Vault | null> => {
  const result = await db.queryObject<Vault>`
    SELECT * FROM vaults WHERE child_id = ${childId}
  `;
  return result.rows[0] ?? null;
};

export const getVaultById = async (vaultId: string): Promise<Vault | null> => {
  const result = await db.queryObject<Vault>`
    SELECT *
    FROM vaults
    WHERE id = ${vaultId}
      AND deleted_at IS NULL
    LIMIT 1;
  `;
  return result.rows[0] ?? null;
};

export const updateVault = async (
  vaultId: string,
  data: Partial<z.infer<typeof VaultSchema>>
): Promise<Vault> => {
  const query = `
    UPDATE vaults
    SET child_id = $1,
        full_name = $2,
        nickname = $3,
        dob = $4,
        id_passport_no = $5,
        home_address = $6,
        updated_at = NOW()
    WHERE id = $7
    RETURNING *;
  `;

  const values = [
    data.child_id ?? null,
    data.full_name ?? null,
    data.nickname ?? null,
    data.dob ?? null,
    data.id_passport_no ?? null,
    data.home_address ?? null,
    vaultId,
  ];

  const result = await db.queryObject<Vault>(query, values);

  if (!result.rows[0]) throw new Error("Vault not found");
  return result.rows[0];
};

export const deleteVault = async (vaultId: string): Promise<void> => {
  await db.queryObject`
      UPDATE vaults SET deleted_at = NOW() WHERE id = ${vaultId}
    `;
};

