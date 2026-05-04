import db from "../db/index.ts";
import { z } from "npm:zod";

export type Medical = {
  id: string;
  vault_id: string;
  blood_type?: string;
  allergies?: string[];
  medication?: string[];
  doctor?: string;
};

export type MedicalInfo = {
  id: string;
  vault_id: string;
  blood_type?: string;
  allergies?: string;
  medication?: string;
  doctor?: string;
  created_at: string;
  updated_at?: string;
};

export const MedicalSchema = z.object({
  vault_id: z.string(),
  blood_type: z.string().max(50).optional(),
  allergies: z.string().max(5000).optional(),
  medication: z.string().max(5000).optional(),
  doctor: z.string().max(200).optional(),
});

export const addMedicalInfo = async (data: z.infer<typeof MedicalSchema>): Promise<MedicalInfo> => {
  MedicalSchema.parse(data);
  const id = crypto.randomUUID();
  const result = await db.queryObject<MedicalInfo>`
    INSERT INTO medical_info (id, vault_id, blood_type, allergies, medication, doctor, created_at)
    VALUES (${id}, ${data.vault_id}, ${data.blood_type}, ${data.allergies}, ${data.medication}, ${data.doctor}, NOW())
    RETURNING *;
  `;
  return result.rows[0];
};

export const updateMedicalInfo = async (
  id: string,
  data: Partial<z.infer<typeof MedicalSchema>>
): Promise<MedicalInfo> => {
  // Convert arrays to strings if necessary
  const allergies = Array.isArray(data.allergies)
    ? data.allergies.join(", ")
    : data.allergies;
  const medication = Array.isArray(data.medication)
    ? data.medication.join(", ")
    : data.medication;

  MedicalSchema.partial().parse({
    ...data,
    allergies,
    medication,
  });

  const query = `
    UPDATE medical_info
    SET blood_type = $1,
        allergies = $2,
        medication = $3,
        doctor = $4,
        updated_at = NOW()
    WHERE id = $5
    RETURNING *;
  `;

  const values = [
    data.blood_type ?? null,
    allergies ?? null,
    medication ?? null,
    data.doctor ?? null,
    id,
  ];

  const result = await db.queryObject<MedicalInfo>(query, values);

  if (!result.rows[0]) throw new Error(`Medical record ${id} not found`);

  return result.rows[0];
};

export const getMedicalInfoById = async (id: string): Promise<MedicalInfo | null> => {
  const result = await db.queryObject<MedicalInfo>`
    SELECT * FROM medical_info
    WHERE id = ${id} AND deleted_at IS NULL;
  `;
  return result.rows[0] ?? null;
};

export const softDeleteMedicalInfo = async (id: string): Promise<MedicalInfo | null> => {
  const result = await db.queryObject<MedicalInfo>`
    UPDATE medical_info
    SET deleted_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  return result.rows[0] ?? null;
};

export const getMedicalDiscoveryByVaultId = async (
  vault_id: string
): Promise<{ exists: boolean; id?: string }> => {
  const result = await db.queryObject<{ id: string }>`
    SELECT id
    FROM medical_info
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
