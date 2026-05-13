import { PageHeader } from "@/components/page-header";
import { ActiveShipmentsMap } from "@/components/active-shipments-map";
import { ResendActivityList } from "@/components/resend-activity-list";
import { SectionCards } from "@/components/section-cards";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />
      <SectionCards />
      <ActiveShipmentsMap />
      <ResendActivityList />
    </div>
  );
}
