// filepath: src/components/storefront/organisms/TrendingSearch.tsx

import { TrendingTag } from "../atoms/TrendingTag";

const TRENDING_TAGS = [
  "Smartphones",
  "Écouteurs Bluetooth",
  "Mode Africaine",
  "Électroménager",
  "Cosmétiques Bio",
  "Chaussures",
  "Montres",
  "Accessoires Tech",
  "Wax",
  "Sacs à Main",
];

export function TrendingSearch() {
  return (
    <section className="container py-6">
      <h2 className="text-base font-semibold mb-3">Recherches Tendances</h2>
      <div className="flex flex-wrap gap-2">
        {TRENDING_TAGS.map((tag) => (
          <TrendingTag key={tag} label={tag} />
        ))}
      </div>
    </section>
  );
}
