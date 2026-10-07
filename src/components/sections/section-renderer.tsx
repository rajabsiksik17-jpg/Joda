import type { ComponentType } from "react";
import type { RenderSection } from "@/lib/content/pages";
import { HeroSection, PageHeaderSection } from "./hero";
import { CardsSection, FaqSection, ProcessSection, RichTextSection, StatementSection, TextMediaSection } from "./content";
import { LeaderMessageSection, PartnersSection, StatsSection, TeamSection } from "./company";
import { ClientsSection, LatestPostsSection, PostListingSection, ServicesSection, TestimonialsSection } from "./collections";
import { ConsultationSection, ContactCardsSection, ContactSection, CtaSection, MapSection } from "./conversion";
import { GallerySection, LogoCloudSection, SpacerSection, VideoSection } from "./media";
import type { SectionContext, SectionProps } from "./shell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<string, ComponentType<SectionProps<any>>> = {
  hero: HeroSection,
  pageHeader: PageHeaderSection,
  textMedia: TextMediaSection,
  richText: RichTextSection,
  statement: StatementSection,
  cards: CardsSection,
  process: ProcessSection,
  faq: FaqSection,
  stats: StatsSection,
  leaderMessage: LeaderMessageSection,
  team: TeamSection,
  partners: PartnersSection,
  services: ServicesSection,
  clients: ClientsSection,
  testimonials: TestimonialsSection,
  latestPosts: LatestPostsSection,
  postListing: PostListingSection,
  cta: CtaSection,
  contact: ContactSection,
  consultation: ConsultationSection,
  contactCards: ContactCardsSection,
  map: MapSection,
  video: VideoSection,
  gallery: GallerySection,
  logoCloud: LogoCloudSection,
  spacer: SpacerSection,
};

export function SectionList({ sections, ctx }: { sections: RenderSection[]; ctx: Omit<SectionContext, "index"> }) {
  return (
    <>
      {sections.map((s, index) => {
        const Cmp = COMPONENTS[s.type];
        if (!Cmp) return null;
        const el = <Cmp key={s.id} data={s.data ?? {}} settings={s.settings ?? {}} ctx={{ ...ctx, index }} />;
        // In preview, anchor each section so the builder can scroll the preview to the one being edited.
        return ctx.isPreview ? <div key={s.id} id={`s-${s.id}`} className="scroll-mt-20">{el}</div> : el;
      })}
    </>
  );
}
