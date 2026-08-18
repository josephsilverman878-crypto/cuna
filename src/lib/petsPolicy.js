// Pets policy is a three-way choice on a listing, replacing the old boolean
// "Pets allowed" amenity. Values are stored in listings.pets_policy.

export const PETS_POLICY_OPTIONS = [
  { value: 'allowed', label: 'Pets allowed' },
  { value: 'cats_only', label: 'Cats only, no dogs' },
  { value: 'none', label: 'No pets' },
]

// Assistance animals are never "pets" under fair housing law — this note is
// shown next to the selector so posters understand the setting has limits.
export const PETS_POLICY_NOTE =
  'Assistance animals and emotional support animals are a reasonable accommodation ' +
  'under fair housing law, not pets, and must be permitted regardless of this setting.'

export function petsPolicyLabel(value) {
  return PETS_POLICY_OPTIONS.find(o => o.value === value)?.label || null
}
