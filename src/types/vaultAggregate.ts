export type VaultAggregate = {
  /** Identity */
  childId: string
  vaultId?: string

  /** Core child info (vaults table) */
  vault: {
    fullName: string
    nickname?: string
    dob?: string
    idPassportNo?: string
    homeAddress?: string
  }

  /** Guardians */
  guardians: {
    id?: string
    name: string
    cell?: string
    work?: string
  }[]

  /** Legal custody (single record) */
  legal?: {
    id?: string
    custodyType?: string
    caseNo?: string
    validUntil?: string
    contactType?: string
  }

  /** Medical (single record) */
  medical?: {
    id?: string
    bloodType?: string
    allergies?: string
    medication?: string
    doctor?: string
  }

  /** Safety (single record) */
  safety?: {
    id?: string
    approvedPickup?: string
    notAllowedPickup?: string
  }

  /** Emergency contacts (multiple) */
  emergencyContacts: {
    id?: string
    name: string
    phone: string
  }[]

  /** Documents */
  documents: {
    id?: string
    name: string
    file?: File
    fileUrl?: string
    category?: string
    subcategory?: string
    isNew?: boolean
  }[]
}
