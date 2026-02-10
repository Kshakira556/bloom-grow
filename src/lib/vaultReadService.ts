// File: /services/vaultReadService.ts
import { http } from "@/lib/http"
import { VaultAggregate } from "@/types/vaultAggregate"

/* -------------------- Backend response shapes -------------------- */
type VaultResponse = { id: string; full_name?: string; nickname?: string; birth_date?: string; id_passport_no?: string; address?: string }
type GuardianResponse = { id: string; name: string; cell_no?: string; work_no?: string }
type LegalResponse = { id: string; custody_type?: string; case_no?: string; valid_until?: string; contact_type?: string }
type MedicalResponse = { id: string; blood_type?: string; allergies?: string; medication?: string; doctor?: string }
type SafetyResponse = { id: string; approved_pickup?: string; not_allowed_pickup?: string }
type EmergencyResponse = { id: string; name: string; phone?: string }
type DocumentResponse = { id: string; name: string; file_url?: string; category?: string; subcategory?: string }

type VaultDiscoveryResponse = { 
  medical: {exists: boolean; id?: string}
  safety: {exists: boolean; id?: string}
  legal: {exists: boolean; id?: string}
  guardians: {exists: boolean; id?: string}
  emergency_contacts: {exists: boolean; id?: string}
  documents: {exists: boolean; id?: string}
}

/* -------------------- Vault Read Service -------------------- */
export const vaultReadService = {
  getVaultAggregate: async (
    childId: string,
    childName?: string
  ): Promise<VaultAggregate | null> => {
    const vaultWrapper = await http<{ vault: VaultResponse }>(
      `/vaults/${childId}`,
      "GET"
    ).catch(() => null)

    if (!vaultWrapper?.vault) {
      // Vault not found
      return null
    }

    const vaultRes = vaultWrapper.vault

    // Safe discovery fetch with fallback defaults
    let discovery: VaultDiscoveryResponse = {
      medical: { exists: false },
      safety: { exists: false },
      legal: { exists: false },
      guardians: { exists: false },
      emergency_contacts: { exists: false },
      documents: { exists: false },
    }

    try {
      const disc = await http<VaultDiscoveryResponse>(
        `/vaults/${vaultRes.id}/discovery`,
        "GET"
      )
      if (disc) discovery = disc
    } catch {
      console.warn(`Vault discovery not found for vaultId=${vaultRes.id}, defaulting to empty`)
    }

    // Conditionally fetch based on discovery
    const [
      guardiansRes,
      medicalRes,
      legalRes,
      safetyRes,
      emergencyRes,
      documentsRes
    ] = await Promise.all([
      discovery.guardians?.exists
        ? http<{ guardians: GuardianResponse[] }>(`/vaults/${vaultRes.id}/guardians`,"GET").then(r => r.guardians)
        : [],

      discovery.medical?.exists && discovery.medical.id
        ? http<{ medical: MedicalResponse }>(`/vaults/medical/${discovery.medical.id}`,"GET").then(r => r.medical)
        : null,

      discovery.legal?.exists && discovery.legal.id
        ? http<{ legal: LegalResponse }>(`/vaults/legal-custody/${discovery.legal.id}`,"GET").then(r => r.legal)
        : null,

      discovery.safety?.exists && discovery.safety.id
        ? http<{ safety: SafetyResponse }>(`/vaults/safety/${discovery.safety.id}`,"GET").then(r => r.safety)
        : null,

      discovery.emergency_contacts?.exists && discovery.emergency_contacts.id
        ? http<{ contact: EmergencyResponse }>(`/vaults/emergency-contacts/${discovery.emergency_contacts.id}`,"GET").then(r => [r.contact])
        : [],

      discovery.documents?.exists && discovery.documents.id
        ? http<{ document: DocumentResponse }>(`/vaults/documents/${discovery.documents.id}`, "GET").then(r => [r.document])
        : []
    ])

    return {
      childId,
      vaultId: vaultRes.id,
      vault: {
        fullName: vaultRes.full_name || childName || "Unnamed Child",
        nickname: vaultRes.nickname,
        dob: vaultRes.birth_date,
        idPassportNo: vaultRes.id_passport_no,
        homeAddress: vaultRes.address
      },
      guardians: (guardiansRes || []).map(g => ({ id: g.id, name: g.name, cell: g.cell_no, work: g.work_no })),
      legal: legalRes
        ? { id: legalRes.id, custodyType: legalRes.custody_type, caseNo: legalRes.case_no, validUntil: legalRes.valid_until, contactType: legalRes.contact_type }
        : undefined,
      medical: medicalRes
        ? { id: medicalRes.id, bloodType: medicalRes.blood_type, allergies: medicalRes.allergies, medication: medicalRes.medication, doctor: medicalRes.doctor }
        : undefined,
      safety: safetyRes
        ? { id: safetyRes.id, approvedPickup: safetyRes.approved_pickup, notAllowedPickup: safetyRes.not_allowed_pickup }
        : undefined,
      emergencyContacts: (emergencyRes || []).map(e => ({ id: e.id, name: e.name, phone: e.phone })),
      documents: (documentsRes || []).map(d => ({ id: d.id, name: d.name, fileUrl: d.file_url, category: d.category, subcategory: d.subcategory }))
    }
  }
}
