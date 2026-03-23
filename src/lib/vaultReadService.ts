// File: /services/vaultReadService.ts
import * as api from "@/lib/api"
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
    const vaultRes = await api.getVaultByChild(childId).catch(() => null)

    if (!vaultRes) {
      // Vault not found
      return null
    }

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
      const disc = await api.getVaultDiscovery(vaultRes.id)
      if (disc) discovery = disc as VaultDiscoveryResponse
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
        ? api.getGuardians(vaultRes.id).then(r => r ?? [])
        : [],

      discovery.medical?.exists && discovery.medical.id
        ? api.getMedical(discovery.medical.id).then(r => r ?? null)
        : null,

      discovery.legal?.exists && discovery.legal.id
        ? api.getLegalCustody(discovery.legal.id).then(r => r ?? null)
        : null,

      discovery.safety?.exists && discovery.safety.id
        ? api.getSafety(discovery.safety.id).then(r => r ?? null)
        : null,

      discovery.emergency_contacts?.exists && discovery.emergency_contacts.id
        ? api.getEmergencyContact(discovery.emergency_contacts.id).then(r => r ? [r as EmergencyResponse] : [])
        : [],

      discovery.documents?.exists && discovery.documents.id
        ? api.getDocument(discovery.documents.id).then(r => r ? [r as DocumentResponse] : [])
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
