import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, StarIcon, ZapIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Gestion des Utilisateurs | Nexiaa Track",
};

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    with: {
      subscriptions: {
        with: {
          plan: true
        }
      }
    }
  });

  const dateLocale = locale === "fr" ? fr : enUS;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-700">
      <PageHeader
        title="Système Utilisateurs"
        description="Vue globale de tous les utilisateurs et leurs abonnements."
      />

      <Card className="glass-card shadow-xl border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserIcon} className="text-primary" size={20} strokeWidth={2} />
            <CardTitle className="text-lg font-semibold">Répertoire Utilisateurs</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-medium">Utilisateur</TableHead>
                <TableHead className="font-medium">Rôle</TableHead>
                <TableHead className="font-medium">Crédits</TableHead>
                <TableHead className="font-medium">Abonnement</TableHead>
                <TableHead className="font-medium">Date d&apos;inscription</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => {
                const activeSub = user.subscriptions?.find(s => s.status === 'active');
                return (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors border-white/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="text-[10px] uppercase font-bold px-2 py-0">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-amber-600">
                        <HugeiconsIcon icon={ZapIcon} size={12} />
                        {user.credits}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activeSub ? (
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={StarIcon} size={14} className="text-primary" />
                          <span className="text-xs font-semibold">{activeSub.plan?.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Aucun</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono">
                      {format(new Date(user.createdAt), "dd MMM yyyy", { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground">
                        <HugeiconsIcon icon={Settings01Icon} size={16} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
