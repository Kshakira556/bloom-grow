import db from "../db/index.ts";
import { z } from "npm:zod";

export type LegalCustody = {
  id: string;
  vault_id: string;
  custody_type: string;
  case_no?: string;
  valid_until?: string;
  contact_type?: string;
};

export const LegalCustodySchema = z.object({
  vault_id: z.string(),
  custody_type: z.string().max(200).optional(),
  case_no: z.string().max(200).optional(),
  valid_until: z.string().max(50).optional(),
  contact_type: z.string().max(200).optional(),
});

export const addLegalCustody = async (data: z.infer<typeof LegalCustodySchema>): Promise<LegalCustody> => {
  LegalCustodySchema.parse(data);
  const id = crypto.randomUUID();
  const result = await db.queryObject<LegalCustody>`
    INSERT INTO legal_custody (id, vault_id, custody_type, case_no, valid_until, contact_type, created_at)
    VALUES (${id}, ${data.vault_id}, ${data.custody_type}, ${data.case_no}, ${data.valid_until}, ${data.contact_type}, NOW())
    RETURNING *;
  `;
  return result.rows[0];
};

// Get legal custody by ID
export const getLegalCustody = async (id: string) => {
  const result = await db.queryObject<LegalCustody>`
    SELECT * FROM legal_custody
    WHERE id = ${id} AND deleted_at IS NULL;
  `;
  return result.rows[0] ?? null;
};

// Update legal custody
export const updateLegalCustody = async (id: string, data: Partial<LegalCustody>) => {
  LegalCustodySchema.partial().parse(data);
  const result = await db.queryObject<LegalCustody>`
    UPDATE legal_custody
    SET custody_type = COALESCE(${data.custody_type}, custody_type),
        case_no = COALESCE(${data.case_no}, case_no),
        valid_until = COALESCE(${data.valid_until}, valid_until),
        contact_type = COALESCE(${data.contact_type}, contact_type),
        updated_at = NOW()
    WHERE id = ${id}
    AND deleted_at IS NULL
    RETURNING *;
  `;
  return result.rows[0] ?? null;
};

// Soft delete legal custody
export const deleteLegalCustody = async (id: string) => {
  const result = await db.queryObject<LegalCustody>`
    UPDATE legal_custody
    SET deleted_at = NOW()
    WHERE id = ${id}
    AND deleted_at IS NULL
    RETURNING *;
  `;
  return result.rows[0] ?? null;
};

// services/legalCustodyService.ts

export const getLegalDiscoveryByVaultId = async (
  vault_id: string
): Promise<{ exists: boolean; id?: string }> => {
  const result = await db.queryObject<{ id: string }>`
    SELECT id
    FROM legal_custody
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
