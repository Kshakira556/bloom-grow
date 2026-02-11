import { http } from "@/lib/http"
import { VaultAggregate } from "@/types/vaultAggregate"

/* -------------------- Backend request shapes -------------------- */
type GuardianRequest = {
  name: string
  cell_no?: string
  work_no?: string
}

type LegalRequest = {
  custody_type?: string
  case_no?: string
  valid_until?: string
  contact_type?: string
}

type MedicalRequest = {
  blood_type?: string
  allergies?: string
  medication?: string
  doctor?: string
}

type SafetyRequest = {
  approved_pickup?: string
  not_allowed_pickup?: string
}

type EmergencyRequest = {
  name: string
  phone: string
}

type DocumentRequest = {
  name: string
  file_url?: string
  category?: string
  subcategory?: string
}

/* -------------------- Vault Save Service -------------------- */
export const vaultSaveService = {
  /**
   * Save full vault aggregate
   */
  saveVaultAggregate: async (aggregate: VaultAggregate) => {
    if (aggregate.vaultId) {
      // Vault already exists, no need to create
      console.log(`[Vault Save] vaultId=${aggregate.vaultId} exists, skipping creation`);
    }
    
    let vaultId = aggregate.vaultId

    // 1️⃣ Ensure vault exists
    if (!vaultId) {
      const payload = {
        child_id: aggregate.childId,
        full_name: aggregate.vault.fullName,
        nickname: aggregate.vault.nickname?.trim() || undefined,
        dob: aggregate.vault.dob?.trim() || undefined,
        id_passport_no: aggregate.vault.idPassportNo?.trim() || undefined,
        home_address: aggregate.vault.homeAddress?.trim() || undefined
      }

      try {
        const createdVault = await http<{ id: string }>("/vaults", "POST", payload)
        if (!createdVault?.id) throw new Error("Vault creation failed: no ID returned")
        vaultId = createdVault.id
        aggregate.vaultId = vaultId
      } catch (err) {
        console.error("[Vault Save] Failed to create vault:", err)
        throw err
      }
    }

    try {
      // --------------------
      // Parallel upserts: Guardians, Legal, Medical, Safety, Emergency
      // --------------------
      await Promise.all([
        // Guardians
      ...aggregate.guardians.map(g =>
        g.id
          ? http<GuardianRequest>(`/guardians/${g.id}`, "PUT", { 
              name: g.name, 
              cell_no: g.cell?.trim() || undefined, 
              work_no: g.work?.trim() || undefined 
            })
          : http<GuardianRequest>(`/vaults/${vaultId}/guardians`, "POST", { 
              name: g.name, 
              cell_no: g.cell?.trim() || undefined, 
              work_no: g.work?.trim() || undefined 
            })
      ),

        // Legal
        aggregate.legal && (async () => {
          if (aggregate.legal.id) {
            try {
              // Check if record exists
              await http<{ legal: VaultAggregate["legal"] | null }>(`/vaults/legal-custody/${aggregate.legal.id}`, "GET");
              // Exists → update
              const payload: LegalRequest = {};
              if (aggregate.legal.custodyType?.trim()) payload.custody_type = aggregate.legal.custodyType.trim();
              if (aggregate.legal.caseNo?.trim()) payload.case_no = aggregate.legal.caseNo.trim();
              if (aggregate.legal.validUntil?.trim()) payload.valid_until = aggregate.legal.validUntil.trim();
              if (aggregate.legal.contactType?.trim()) payload.contact_type = aggregate.legal.contactType.trim();

              const updated = await http<LegalRequest & { id: string }>(
                `/vaults/legal-custody/${aggregate.legal.id}`,
                "PUT",
                payload
              );
              aggregate.legal.id = updated.id;
              return updated;
            } catch {
              // ID doesn't exist → create
              const created = await http<LegalRequest & { id: string }>(
                `/vaults/${vaultId}/legal-custody`,
                "POST",
                {
                  vault_id: vaultId,
                  custody_type: aggregate.legal.custodyType?.trim() || undefined,
                  case_no: aggregate.legal.caseNo?.trim() || undefined,
                  valid_until: aggregate.legal.validUntil?.trim() || undefined,
                  contact_type: aggregate.legal.contactType?.trim() || undefined
                }
              );
              aggregate.legal.id = created.id;
              return created;
            }
          } else {
            // No ID → create
            const created = await http<LegalRequest & { id: string }>(
              `/vaults/${vaultId}/legal-custody`,
              "POST",
              {
                vault_id: vaultId,
                custody_type: aggregate.legal.custodyType?.trim() || undefined,
                case_no: aggregate.legal.caseNo?.trim() || undefined,
                valid_until: aggregate.legal.validUntil?.trim() || undefined,
                contact_type: aggregate.legal.contactType?.trim() || undefined
              }
            );
            aggregate.legal.id = created.id;
            return created;
          }
        })(),

        // Medical
        aggregate.medical && (async () => {
          if (aggregate.medical.id) {
            try {
              await http<{ medical: VaultAggregate["medical"] | null }>(`/vaults/medical/${aggregate.medical.id}`, "GET");
              const updated = await http<MedicalRequest & { id: string }>(
                `/vaults/medical/${aggregate.medical.id}`,
                "PUT",
                {
                  blood_type: aggregate.medical.bloodType?.trim() || undefined,
                  allergies: aggregate.medical.allergies?.trim() || undefined,
                  medication: aggregate.medical.medication?.trim() || undefined,
                  doctor: aggregate.medical.doctor?.trim() || undefined
                }
              );
              aggregate.medical.id = updated.id;
              return updated;
            } catch {
              const created = await http<MedicalRequest & { id: string }>(
                `/vaults/${vaultId}/medical`,
                "POST",
                {
                  blood_type: aggregate.medical.bloodType?.trim() || undefined,
                  allergies: aggregate.medical.allergies?.trim() || undefined,
                  medication: aggregate.medical.medication?.trim() || undefined,
                  doctor: aggregate.medical.doctor?.trim() || undefined
                }
              );
              aggregate.medical.id = created.id;
              return created;
            }
          } else {
            const created = await http<MedicalRequest & { id: string }>(
              `/vaults/${vaultId}/medical`,
              "POST",
              {
                blood_type: aggregate.medical.bloodType?.trim() || undefined,
                allergies: aggregate.medical.allergies?.trim() || undefined,
                medication: aggregate.medical.medication?.trim() || undefined,
                doctor: aggregate.medical.doctor?.trim() || undefined
              }
            );
            aggregate.medical.id = created.id;
            return created;
          }
        })(),

        // Safety
        aggregate.safety && (async () => {
          if (aggregate.safety.id) {
            try {
              await http<{ safety: VaultAggregate["safety"] | null }>(`/vaults/safety/${aggregate.safety.id}`, "GET");
              const updated = await http<SafetyRequest & { id: string }>(
                `/vaults/safety/${aggregate.safety.id}`,
                "PUT",
                {
                  approved_pickup: aggregate.safety.approvedPickup?.trim() || undefined,
                  not_allowed_pickup: aggregate.safety.notAllowedPickup?.trim() || undefined
                }
              );
              aggregate.safety.id = updated.id;
              return updated;
            } catch {
              const created = await http<SafetyRequest & { id: string }>(
                `/vaults/${vaultId}/safety`,
                "POST",
                {
                  approved_pickup: aggregate.safety.approvedPickup?.trim() || undefined,
                  not_allowed_pickup: aggregate.safety.notAllowedPickup?.trim() || undefined
                }
              );
              aggregate.safety.id = created.id;
              return created;
            }
          } else {
            const created = await http<SafetyRequest & { id: string }>(
              `/vaults/${vaultId}/safety`,
              "POST",
              {
                approved_pickup: aggregate.safety.approvedPickup?.trim() || undefined,
                not_allowed_pickup: aggregate.safety.notAllowedPickup?.trim() || undefined
              }
            );
            aggregate.safety.id = created.id;
            return created;
          }
        })(),

        // Emergency Contacts
        ...aggregate.emergencyContacts.map(e => (async () => {
          if (e.id) {
            try {
              await http<{ contact: VaultAggregate["emergencyContacts"][0] | null }>(`/vaults/emergency-contacts/${e.id}`, "GET");
              const updated = await http<EmergencyRequest & { id: string }>(
                `/vaults/emergency-contacts/${e.id}`,
                "PUT",
                { name: e.name, phone: e.phone?.trim() || undefined }
              );
              e.id = updated.id;
              return updated;
            } catch {
              const created = await http<EmergencyRequest & { id: string }>(
                `/vaults/${vaultId}/emergency-contacts`,
                "POST",
                { name: e.name, phone: e.phone?.trim() || undefined }
              );
              e.id = created.id;
              return created;
            }
          } else {
            const created = await http<EmergencyRequest & { id: string }>(
              `/vaults/${vaultId}/emergency-contacts`,
              "POST",
              { name: e.name, phone: e.phone?.trim() || undefined }
            );
            e.id = created.id;
            return created;
          }
        })())
          ])

      // --------------------
      // Simple retry helper for documents
      // --------------------
      async function retry<T>(
        fn: () => Promise<T>,
        retries = 2,
        delayMs = 300
      ): Promise<T> {
        let lastError: unknown;
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            return await fn();
          } catch (err) {
            lastError = err;
            if (attempt < retries) {
              console.warn(`Retry attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`);
              await new Promise((r) => setTimeout(r, delayMs));
            }
          }
        }
        throw lastError;
      }

      for (const d of aggregate.documents || []) {
        if (!d.id) {
          try {
            await retry(async () => {
              console.log(`[Vault Save] childId=${aggregate.childId} vaultId=${vaultId} -> saving document "${d.name}"`);
              await http<DocumentRequest>(`/vaults/${vaultId}/documents`, "POST", {
                name: d.name,
                file_url: d.fileUrl,
                category: d.category,
                subcategory: d.subcategory
              });
            }, 2, 300); // 2 retries, 300ms delay
          } catch (err) {
            console.error(`[Vault Save] Failed to save document "${d.name}", continuing`, err);
          }
        }
      }

      return vaultId
    } catch (err) {
      console.error("Failed to save VaultAggregate:", err)
      throw err
    }
  }
}
