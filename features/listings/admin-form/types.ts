// Shared types used by the admin listing form and its extracted
// sub-components (features/listings/admin-form/fields + managers).

export interface GalleryImage { id: string; url: string; sort_order: number }

export interface Agent {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  photo_url: string;
  isNew?: boolean;
  saving?: boolean;
  deleting?: boolean;
  // Transient UI flag flipped on for ~2.5s after a successful save so the
  // Save button can show "✓ Saved" and the admin actually knows their click
  // did something. Fades back to false via setTimeout.
  justSaved?: boolean;
}
