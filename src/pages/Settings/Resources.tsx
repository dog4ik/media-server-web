import SectionSubTitle from "@/components/Settings/SectionSubTitle";
import TranscodedVariantsList from "@/components/Settings/TranscodedVariantsList";

export function ResourcesPage() {
  return (
      <div>
        <SectionSubTitle name="Transcoded variants" />
        <TranscodedVariantsList />
      </div>
  );
}
