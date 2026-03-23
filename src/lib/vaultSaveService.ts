import * as api from "@/lib/api"
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
        const createdVault = await api.createVault(payload)
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
          ? api.updateGuardian(g.id, { 
              name: g.name, 
              cell_no: g.cell?.trim() || undefined, 
              work_no: g.work?.trim() || undefined 
            })
          : api.createGuardian(vaultId!, { 
              name: g.name, 
              cell_no: g.cell?.trim() || undefined, 
              work_no: g.work?.trim() || undefined 
            })
      ),

        // Legal
        aggregate.legal && (async () => {
          const legal = aggregate.legal;
          if (!legal) return null;
          if (legal.id) {
            try {
              // Check if record exists
              await api.getLegalCustody(legal.id);
              // Exists → update
              const payload: LegalRequest = {};
              if (legal.custodyType?.trim()) payload.custody_type = legal.custodyType.trim();
              if (legal.caseNo?.trim()) payload.case_no = legal.caseNo.trim();
              if (legal.validUntil?.trim()) payload.valid_until = legal.validUntil.trim();
              if (legal.contactType?.trim()) payload.contact_type = legal.contactType.trim();

              const updated = await api.updateLegalCustody(legal.id, payload);
              if (!updated?.id) throw new Error("Failed to update legal custody");
              legal.id = updated.id;
              return updated;
            } catch {
              // ID doesn't exist → create
              const created = await api.createLegalCustody(vaultId!, {
                custody_type: legal.custodyType?.trim() || undefined,
                case_no: legal.caseNo?.trim() || undefined,
                valid_until: legal.validUntil?.trim() || undefined,
                contact_type: legal.contactType?.trim() || undefined
              });
              if (!created?.id) throw new Error("Failed to create legal custody");
              legal.id = created.id;
              return created;
            }
          } else {
            // No ID → create
            const created = await api.createLegalCustody(vaultId!, {
              custody_type: legal.custodyType?.trim() || undefined,
              case_no: legal.caseNo?.trim() || undefined,
              valid_until: legal.validUntil?.trim() || undefined,
              contact_type: legal.contactType?.trim() || undefined
            });
            if (!created?.id) throw new Error("Failed to create legal custody");
            legal.id = created.id;
            return created;
          }
        })(),

        // Medical
        aggregate.medical && (async () => {
          const medical = aggregate.medical;
          if (!medical) return null;
          if (medical.id) {
            try {
              await api.getMedical(medical.id);
              const updated = await api.updateMedical(medical.id, {
                blood_type: medical.bloodType?.trim() || undefined,
                allergies: Array.isArray(medical.allergies)
                  ? medical.allergies.join(", ")
                  : medical.allergies?.trim() || undefined,
                medication: Array.isArray(medical.medication)
                  ? medical.medication.join(", ")
                  : medical.medication?.trim() || undefined,
                doctor: medical.doctor?.trim() || undefined
              });
              if (!updated?.id) throw new Error("Failed to update medical");
              medical.id = updated.id;
              return updated;
            } catch {
              const created = await api.createMedical(vaultId!, {
                blood_type: medical.bloodType?.trim() || undefined,
                allergies: medical.allergies?.trim() || undefined,
                medication: medical.medication?.trim() || undefined,
                doctor: medical.doctor?.trim() || undefined
              });
              if (!created?.id) throw new Error("Failed to create medical");
              medical.id = created.id;
              return created;
            }
          } else {
            const created = await api.createMedical(vaultId!, {
              blood_type: medical.bloodType?.trim() || undefined,
              allergies: medical.allergies?.trim() || undefined,
              medication: medical.medication?.trim() || undefined,
              doctor: medical.doctor?.trim() || undefined
            });
            if (!created?.id) throw new Error("Failed to create medical");
            medical.id = created.id;
            return created;
          }
        })(),

        // Safety
        aggregate.safety && (async () => {
          const safety = aggregate.safety;
          if (!safety) return null;
          if (safety.id) {
            try {
              await api.getSafety(safety.id);
              const updated = await api.updateSafety(safety.id, {
                approved_pickup: safety.approvedPickup?.trim() || undefined,
                not_allowed_pickup: safety.notAllowedPickup?.trim() || undefined
              });
              if (!updated?.id) throw new Error("Failed to update safety");
              safety.id = updated.id;
              return updated;
            } catch {
              const created = await api.createSafety(vaultId!, {
                approved_pickup: safety.approvedPickup?.trim() || undefined,
                not_allowed_pickup: safety.notAllowedPickup?.trim() || undefined
              });
              if (!created?.id) throw new Error("Failed to create safety");
              safety.id = created.id;
              return created;
            }
          } else {
            const created = await api.createSafety(vaultId!, {
              approved_pickup: safety.approvedPickup?.trim() || undefined,
              not_allowed_pickup: safety.notAllowedPickup?.trim() || undefined
            });
            if (!created?.id) throw new Error("Failed to create safety");
            safety.id = created.id;
            return created;
          }
        })(),

        // Emergency Contacts
        ...aggregate.emergencyContacts.map(e => (async () => {
          if (e.id) {
            try {
              await api.getEmergencyContact(e.id);
              const updated = await api.updateEmergencyContact(e.id, {
                name: e.name,
                phone: e.phone?.trim() || undefined
              });
              if (!updated?.id) throw new Error("Failed to update emergency contact");
              e.id = updated.id;
              return updated;
            } catch {
              const created = await api.createEmergencyContact(vaultId!, {
                name: e.name,
                phone: e.phone?.trim() || undefined
              });
              if (!created?.id) throw new Error("Failed to create emergency contact");
              e.id = created.id;
              return created;
            }
          } else {
            const created = await api.createEmergencyContact(vaultId!, {
              name: e.name,
              phone: e.phone?.trim() || undefined
            });
            if (!created?.id) throw new Error("Failed to create emergency contact");
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
              await api.addDocument(vaultId!, {
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
