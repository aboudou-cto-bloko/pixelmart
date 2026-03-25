// filepath: src/constants/imageRoles.ts

export const IMAGE_ROLES = [
  { value: "main", label: "Principale" },
  { value: "usage", label: "Utilisation" },
  { value: "zoom", label: "Zoom produit" },
  { value: "detail", label: "Détail" },
  { value: "lifestyle", label: "Lifestyle" },
] as const;

export type ImageRole = (typeof IMAGE_ROLES)[number]["value"];

export function getRoleLabel(value: string): string {
  return IMAGE_ROLES.find((r) => r.value === value)?.label ?? value;
}
