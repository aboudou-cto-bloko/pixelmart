// filepath: src/components/storefront/templates/HomepageTemplate.tsx

import {
  TopPromoBanner,
  CategoryBar,
  HeroSection,
  SubHeroCards,
  WeeklyDeals,
  TrendingSearch,
  MidBanner,
  BestSeller,
  PopularBrands,
  ProductSpotlight,
  JustLanding,
  NewsletterBar,
} from "../organisms";

export function HomepageTemplate() {
  return (
    <>
      <TopPromoBanner />
      <CategoryBar />
      <HeroSection />
      <SubHeroCards />
      <WeeklyDeals />
      <TrendingSearch />
      <MidBanner />
      <BestSeller />
      <PopularBrands />
      {/* SuggestToday — à implémenter dans un second temps */}
      <ProductSpotlight />
      <JustLanding />
      <NewsletterBar />
    </>
  );
}
