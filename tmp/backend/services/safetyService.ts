import db from "../db/index.ts";
import { z } from "npm:zod";

export type Safety = {
  id: string;
  vault_id: string;
  approved_pickup_persons?: string[];
  not_allowed_pickup_persons?: string[];
};

export type SafetyInfo = {
  id: string;
  vault_id: string;
  approved_pickup?: string;
  not_allowed_pickup?: string;
  created_at: string;
  updated_at?: string;
};

export const SafetySchema = z.object({
  vault_id: z.string(),
  approved_pickup: z.string().max(5000).optional(),
  not_allowed_pickup: z.string().max(5000).optional(),
});

const SafetyUpdateSchema = z.object({
  approved_pickup: z.string().max(5000).optional(),
  not_allowed_pickup: z.string().max(5000).optional(),
});


export const addSafetyInfo = async (data: z.infer<typeof SafetySchema>): Promise<SafetyInfo> => {
  SafetySchema.parse(data);
  const id = crypto.randomUUID();
  const result = await db.queryObject<SafetyInfo>`
    INSERT INTO safety_info (id, vault_id, approved_pickup, not_allowed_pickup, created_at)
    VALUES (${id}, ${data.vault_id}, ${data.approved_pickup}, ${data.not_allowed_pickup}, NOW())
    RETURNING *;
  `;
  return result.rows[0];
};

// Get by ID
export const getSafetyInfo = async (id: string) => {
  const result = await db.queryObject<SafetyInfo>`
    SELECT * FROM safety_info
    WHERE id = ${id} AND deleted_at IS NULL;
  `;
  return result.rows[0] ?? null;
};

// Update
export const updateSafetyInfo = async (id: string, data: Partial<SafetyInfo>) => {
  SafetyUpdateSchema.parse({
    approved_pickup: data.approved_pickup,
    not_allowed_pickup: data.not_allowed_pickup,
  });
  const result = await db.queryObject<SafetyInfo>`
    UPDATE safety_info
    SET approved_pickup = COALESCE(${data.approved_pickup}, approved_pickup),
        not_allowed_pickup = COALESCE(${data.not_allowed_pickup}, not_allowed_pickup),
        updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *;
  `;
  return result.rows[0] ?? null;
};

// Soft delete
export const deleteSafetyInfo = async (id: string) => {
  const result = await db.queryObject<SafetyInfo>`
    UPDATE safety_info
    SET deleted_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *;
  `;
  return result.rows[0] ?? null;
};

// services/safetyService.ts

export const getSafetyDiscoveryByVaultId = async (
  vault_id: string
): Promise<{ exists: boolean; id?: string }> => {
  const result = await db.queryObject<{ id: string }>`
    SELECT id
    FROM safety_info
    WHERE vault_id = ${vault_id}
      AND deleted_at IS NULL
    LIMIT 1;
  `;

  if (result.rows.length === 0) {
    return { exists: false };
  }

  return {
    exists: true,
    id: result.rows[0].id,
  };
};
