"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Settings01Icon,
  Notification01Icon
} from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const t = useTranslations("pages.settings");
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const sections = useMemo(() => [
    {
      id: "profile",
      title: t("profileTitle"),
      description: t("profileDesc"),
      icon: UserIcon,
      fields: [
        { label: "Full Name", value: user?.name, type: "text" },
        { label: "Email Address", value: user?.email, type: "email", disabled: true },
      ]
    },
    ...(isAdmin ? [{
      id: "system",
      title: t("systemTitle"),
      description: t("systemDesc"),
      icon: Settings01Icon,
      fields: [
        { label: "Company Name", value: "Nexiaa Track Logistics", type: "text" },
        { label: "Default Currency", value: "USD ($)", type: "text" },
        { label: "Global Tax Rate (%)", value: "15", type: "number" },
      ]
    }] : []),
    {
      id: "notifications",
      title: t("notificationsTitle"),
      description: t("notificationsDesc"),
      icon: Notification01Icon,
      fields: [
        { label: "Email Alerts", value: "Enabled", type: "text", disabled: true },
        { label: "WhatsApp Updates", value: "Disabled", type: "text", disabled: true },
      ]
    }
  ], [user, isAdmin, t]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList className="bg-muted/30 border border-white/5 p-1 h-12 rounded-xl backdrop-blur-sm">
          {sections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={section.icon} size={16} strokeWidth={2} />
                <span className="font-semibold text-sm">{section.title}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-white/5 bg-muted/20 backdrop-blur-sm overflow-hidden glass-card">
              <CardHeader className="border-b border-white/5 bg-muted/30">
                <div>
                  <CardTitle className="text-lg font-bold">{section.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/70">
                    {section.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 max-w-2xl">
                  {section.fields.map((field) => (
                    <div key={field.label} className="grid gap-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground/80">
                        {field.label}
                      </Label>
                      <Input
                        type={field.type}
                        defaultValue={field.value ?? ""}
                        disabled={field.disabled}
                        className="h-11 rounded-xl border-white/10 bg-background/50 focus:bg-background"
                      />
                    </div>
                  ))}
                  <div className="pt-4 flex justify-end">
                    <Button className="rounded-xl px-8 font-semibold btn-shiny">
                      {t("save")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
