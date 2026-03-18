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
  SuggestToday,
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
      <SuggestToday />
      <ProductSpotlight />
      <JustLanding />
    </>
  );
}
