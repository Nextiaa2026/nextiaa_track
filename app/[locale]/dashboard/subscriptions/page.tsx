import { Metadata } from "next";
import { SubscriptionsStats } from "@/components/subscriptions-stats";
import { BuyCreditsDialog } from "@/components/buy-credits-dialog";
import { PageHeader } from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { creditLedger, subscriptionPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, Invoice01Icon, UserIcon, CheckmarkCircle01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Abonnements | Nexiaa track",
  description: "Gérez votre abonnement et vos crédits.",
};

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const dateLocale = locale === "fr" ? fr : enUS;

  const ledgerEntries = session?.user
    ? await db.query.creditLedger.findMany({
        where: eq(creditLedger.userId, parseInt(session.user.id)),
        orderBy: [desc(creditLedger.createdAt)],
        limit: 10,
      })
    : [];

  const plans = await db.query.subscriptionPlans.findMany({
    where: eq(subscriptionPlans.isActive, true),
    orderBy: [desc(subscriptionPlans.priceMonthly)],
  });

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-700">
      <PageHeader
        title="Abonnements & Crédits"
        description="Suivez votre consommation de crédits et gérez votre forfait."
        actions={<BuyCreditsDialog />}
      />

      <SubscriptionsStats />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Plans Grid */}
        <div className="lg:col-span-3 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={`glass-card shadow-xl border-white/10 overflow-hidden relative flex flex-col ${plan.name === 'starter' ? 'border-primary/30 ring-1 ring-primary/20 scale-[1.02] z-10' : ''}`}>
              {plan.name === 'starter' && (
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary border-none shadow-lg">
                    Populaire
                  </Badge>
                </div>
              )}
              <CardHeader className={`border-b border-white/5 pb-4 ${plan.name === 'starter' ? 'bg-primary/10' : 'bg-muted/30'}`}>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon 
                    icon={plan.name === 'professional' ? StarIcon : plan.name === 'starter' ? ZapIcon : UserIcon} 
                    className={plan.name === 'free' ? 'text-gray-400' : plan.name === 'starter' ? 'text-amber-500' : 'text-primary'} 
                    size={20} 
                    strokeWidth={2} 
                  />
                  <div>
                    <CardTitle className="text-lg font-semibold">{plan.displayName}</CardTitle>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 flex-1 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-heading">{plan.priceMonthly / 100}€</span>
                  <span className="text-muted-foreground text-sm">/ mois</span>
                </div>
                
                <ul className="space-y-4 flex-1">
                  {JSON.parse(plan.features || "[]").map((feature: string, i: number) => (
                    <li key={i} className="flex gap-3 text-xs">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className={`w-full h-11 rounded-xl font-semibold mt-6 ${plan.name === 'free' ? 'variant-outline' : 'btn-shiny'}`}>
                  {plan.name === 'free' ? 'Plan Actuel' : 'Choisir ce forfait'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 glass-card shadow-xl border-white/10 overflow-hidden flex flex-col">
          <CardHeader className="border-b border-white/5 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Invoice01Icon} className="text-primary" size={20} strokeWidth={2} />
              <div>
                <CardTitle className="text-lg font-semibold">Activité Récente</CardTitle>
                <CardDescription>Vos dernières transactions de crédits.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px] font-medium">Date</TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead className="text-right font-medium">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <HugeiconsIcon icon={Invoice01Icon} size={32} className="opacity-20" />
                        <p>Aucune activité enregistrée.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors border-white/5">
                      <TableCell className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(entry.createdAt), "dd MMM yyyy · HH:mm", { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{entry.description}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {entry.reason.replace(/_/g, " ")}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${entry.amount > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {entry.amount > 0 ? "+" : ""}{entry.amount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Credit Pricing Info */}
        <Card className="glass-card shadow-md border-white/10 overflow-hidden h-fit">
          <CardHeader className="border-b border-white/5 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={ZapIcon} className="text-amber-500" size={20} strokeWidth={2} />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">Tarification des Crédits</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-muted-foreground">Expédition</span>
                <Badge variant="outline" className="font-bold border-amber-500/20 text-amber-600 bg-amber-500/5">5 Crédits</Badge>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-muted-foreground">Voyage / Trip</span>
                <Badge variant="outline" className="font-bold border-amber-500/20 text-amber-600 bg-amber-500/5">3 Crédits</Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Notification Email</span>
                <Badge variant="outline" className="font-bold border-amber-500/20 text-amber-600 bg-amber-500/5">1 Crédit</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
