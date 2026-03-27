"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import {
  Package,
  Puzzle,
  Users,
  DollarSign,
  Search,
  ScanBarcode,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Stats {
  totalSets: number;
  totalPieces: number;
  totalMinifigs: number;
  estimatedValue: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading } = useSWR<Stats>("/api/sets/stats", fetcher);

  const displayName =
    (session?.user as { displayName?: string })?.displayName ||
    (session?.user as { username?: string })?.username ||
    session?.user?.name ||
    "Collector";

  const statCards = [
    {
      label: "Total Sets",
      value: stats?.totalSets ?? 0,
      icon: Package,
      color: "text-blue-500",
    },
    {
      label: "Total Pieces",
      value: stats?.totalPieces ?? 0,
      icon: Puzzle,
      color: "text-green-500",
    },
    {
      label: "Minifigs",
      value: stats?.totalMinifigs ?? 0,
      icon: Users,
      color: "text-purple-500",
    },
    {
      label: "Est. Value",
      value: stats?.estimatedValue
        ? `$${stats.estimatedValue.toLocaleString()}`
        : "$0",
      icon: DollarSign,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Hello, {displayName}!</h1>
        <p className="text-muted-foreground">Welcome to your LEGO dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-lg font-bold">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state hint */}
      {!isLoading && (!stats || stats.totalSets === 0) && (
        <Card>
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            Add sets to see your collection stats!
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/search">
              <Search className="h-6 w-6" />
              <span>Add a Set</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/scan">
              <ScanBarcode className="h-6 w-6" />
              <span>Scan Barcode</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
