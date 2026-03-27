// filepath: convex/seed/data.ts
// Données statiques pour le seed de test

export const SEED_USERS = [
  {
    email: "admin@pixel-mart.test",
    password: "Admin@PixelMart2025!",
    name: "Admin Pixel-Mart",
    role: "admin" as const,
  },
  {
    email: "vendor@pixel-mart.test",
    password: "Vendor@PixelMart2025!",
    name: "Kofi Mensah",
    role: "vendor" as const,
  },
  {
    email: "vendor2@pixel-mart.test",
    password: "Vendor2@PixelMart2025!",
    name: "Aminata Diallo",
    role: "vendor" as const,
  },
  {
    email: "customer@pixel-mart.test",
    password: "Customer@PixelMart2025!",
    name: "Jean-Baptiste Zinsou",
    role: "customer" as const,
  },
  {
    email: "agent@pixel-mart.test",
    password: "Agent@PixelMart2025!",
    name: "Moussa Coulibaly",
    role: "agent" as const,
  },
] as const;

export const SEED_STORES = [
  {
    vendorEmail: "vendor@pixel-mart.test",
    name: "TechShop Cotonou",
    slug: "techshop-cotonou",
    description:
      "Votre boutique de référence pour l'électronique et les accessoires tech en Afrique de l'Ouest. Produits garantis, livraison rapide.",
    country: "BJ",
    currency: "XOF",
    contact_phone: "+22961000001",
    contact_whatsapp: "+22961000001",
    contact_email: "contact@techshop-cotonou.test",
    subscription_tier: "pro" as const,
    is_verified: true,
  },
  {
    vendorEmail: "vendor2@pixel-mart.test",
    name: "Mode Africaine",
    slug: "mode-africaine",
    description:
      "La mode africaine authentique : wax, bogolan, broderies. Créateur basé à Cotonou, livraison internationale.",
    country: "BJ",
    currency: "XOF",
    contact_phone: "+22961000002",
    contact_whatsapp: "+22961000002",
    contact_email: "contact@mode-africaine.test",
    subscription_tier: "free" as const,
    is_verified: false,
  },
] as const;

// Images Picsum avec seeds fixes (même image à chaque run)
export const PRODUCT_IMAGE_SEEDS = {
  electronique: [10, 20, 30, 40, 50],
  mode: [60, 70, 80, 90, 100],
  maison: [110, 120, 130, 140, 150],
  beaute: [160, 170, 180, 190, 200],
  alimentation: [210, 220, 230, 240, 250],
  sport: [260, 270, 280, 290, 300],
};

export type SeedCategory =
  | "electronique"
  | "mode"
  | "maison"
  | "beaute"
  | "alimentation"
  | "sport";

export const SEED_PRODUCTS: Record<
  string,
  Array<{
    title: string;
    description: string;
    short_description: string;
    price: number;
    compare_price?: number;
    quantity: number;
    tags: string[];
    categorySlug: SeedCategory;
    color?: string;
    material?: string;
    weight?: number;
  }>
> = {
  "techshop-cotonou": [
    {
      title: "Smartphone Tecno Spark 20 Pro",
      description:
        "<p>Le <strong>Tecno Spark 20 Pro</strong> est le smartphone idéal pour rester connecté en Afrique de l'Ouest.</p><ul><li>Écran 6.78&quot; AMOLED 120Hz</li><li>Processeur Helio G99</li><li>Batterie 5000mAh charge 33W</li><li>Appareil photo 50MP + IA</li><li>Double SIM + 5G</li></ul><p>Garantie 1 an. Livraison sous 48h à Cotonou.</p>",
      short_description: "Smartphone 6.78\" AMOLED - 8Go RAM - 256Go - Batterie 5000mAh",
      price: 9500000,
      compare_price: 11000000,
      quantity: 25,
      tags: ["smartphone", "tecno", "android", "5g"],
      categorySlug: "electronique",
      color: "Noir",
      weight: 210,
    },
    {
      title: "Écouteurs Bluetooth TWS Pro",
      description:
        "<p>Écouteurs sans fil avec réduction de bruit active. Jusqu'à <strong>32h d'autonomie</strong> avec le boîtier de charge.</p><ul><li>ANC -35dB</li><li>Latence 45ms mode gaming</li><li>IPX5 waterproof</li><li>Bluetooth 5.3</li></ul>",
      short_description: "ANC - 32h autonomie - Bluetooth 5.3 - IPX5",
      price: 2500000,
      compare_price: 3200000,
      quantity: 50,
      tags: ["écouteurs", "bluetooth", "anc", "sans fil"],
      categorySlug: "electronique",
      color: "Blanc",
      weight: 45,
    },
    {
      title: "Chargeur Solaire 20W Portable",
      description:
        "<p>Chargeur solaire portable idéal pour les zones avec coupures fréquentes. Charge simultanément 2 appareils.</p><ul><li>Panneau 20W haute efficacité</li><li>2 ports USB-A + 1 USB-C</li><li>Pliable et léger (320g)</li><li>Résistant aux chocs</li></ul>",
      short_description: "20W - 3 ports - Pliable - 320g",
      price: 3500000,
      quantity: 30,
      tags: ["chargeur", "solaire", "portable", "énergie"],
      categorySlug: "electronique",
      weight: 320,
    },
    {
      title: "Tablette Android 10 pouces",
      description:
        "<p>Tablette parfaite pour les étudiants et entrepreneurs. Processeur octa-core, stockage extensible.</p><ul><li>Écran 10.1\" IPS 1920x1200</li><li>4Go RAM / 128Go stockage</li><li>Batterie 7000mAh</li><li>Double SIM + 4G</li></ul>",
      short_description: "10.1\" IPS - 4Go RAM - 128Go - 4G",
      price: 7200000,
      compare_price: 8500000,
      quantity: 15,
      tags: ["tablette", "android", "4g", "étudiant"],
      categorySlug: "electronique",
      weight: 480,
    },
    {
      title: "Powerbank 20000mAh",
      description:
        "<p>Batterie externe haute capacité pour ne jamais tomber à court d'énergie.</p><ul><li>20000mAh - charge 3 smartphones</li><li>Charge rapide 22.5W</li><li>3 sorties USB + 1 USB-C</li><li>Affichage LED de la charge</li></ul>",
      short_description: "20000mAh - Charge rapide 22.5W - 4 ports",
      price: 1800000,
      quantity: 60,
      tags: ["powerbank", "batterie", "charge rapide"],
      categorySlug: "electronique",
      weight: 380,
    },
  ],
  "mode-africaine": [
    {
      title: "Robe Wax Pagne Premium",
      description:
        "<p>Robe élégante en tissu wax authentique 100% coton importé. Couture artisanale, finitions soignées.</p><ul><li>Tissu wax 100% coton premium</li><li>Tailles disponibles : S, M, L, XL</li><li>Couleurs vives, lavage à 30°C</li><li>Confectionnée à Cotonou</li></ul>",
      short_description: "Wax 100% coton - Couture artisanale - Tailles S à XL",
      price: 1500000,
      compare_price: 1800000,
      quantity: 20,
      tags: ["wax", "robe", "africain", "coton", "artisanal"],
      categorySlug: "mode",
      color: "Multicolore",
      material: "Wax coton",
      weight: 350,
    },
    {
      title: "Chemise Homme Bogolan",
      description:
        "<p>Chemise en tissu bogolan, technique de teinture traditionnelle du Mali. Pièce unique, portée à l'occasion ou au quotidien.</p>",
      short_description: "Bogolan traditionnel - Fait main - Tailles M à XXL",
      price: 1200000,
      quantity: 15,
      tags: ["bogolan", "chemise", "mali", "traditionnel", "artisanal"],
      categorySlug: "mode",
      color: "Marron/Beige",
      material: "Coton bogolan",
      weight: 280,
    },
    {
      title: "Sac à main en cuir naturel",
      description:
        "<p>Sac à main confectionné en cuir naturel tanné de manière traditionnelle par des artisans locaux.</p><ul><li>Cuir naturel tanné végétal</li><li>Dimensions : 35 x 25 x 12 cm</li><li>Bandoulière réglable</li><li>Fermeture magnétique</li></ul>",
      short_description: "Cuir naturel - 35x25cm - Artisan local",
      price: 2500000,
      compare_price: 3000000,
      quantity: 10,
      tags: ["sac", "cuir", "artisanal", "femme", "accessoire"],
      categorySlug: "mode",
      color: "Camel",
      material: "Cuir naturel",
      weight: 450,
    },
    {
      title: "Ensemble Pagne 3 pièces Femme",
      description:
        "<p>Ensemble complet haut + jupe + foulard en pagne wax premium. Idéal pour cérémonies et sorties.</p>",
      short_description: "3 pièces - Haut + Jupe + Foulard - Wax premium",
      price: 2800000,
      quantity: 12,
      tags: ["pagne", "ensemble", "céremonie", "wax", "femme"],
      categorySlug: "mode",
      color: "Bleu/Orange",
      material: "Wax coton",
      weight: 600,
    },
    {
      title: "Sandales Artisanales Cuir",
      description:
        "<p>Sandales en cuir véritable fabriquées à la main. Confort toute la journée, semelle anatomique.</p>",
      short_description: "Cuir véritable - Fait main - Tailles 36-45",
      price: 900000,
      compare_price: 1100000,
      quantity: 30,
      tags: ["sandales", "cuir", "artisanal", "chaussures"],
      categorySlug: "mode",
      color: "Marron",
      material: "Cuir",
      weight: 380,
    },
  ],
};
