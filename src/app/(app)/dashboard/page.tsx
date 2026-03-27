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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

interface ThemeBreakdown {
  theme: string;
  count: number;
  pieces: number;
}

interface YearBreakdown {
  year: number;
  count: number;
}

interface Stats {
  totalSets: number;
  totalPieces: number;
  ownedSets: number;
  wishlistSets: number;
  wantedSets: number;
  estimatedValue: number;
  builtSets: number;
  sealedSets: number;
  totalMinifigs: number;
  themeBreakdown: ThemeBreakdown[];
  yearBreakdown: YearBreakdown[];
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

  const builtCount = stats?.builtSets ?? 0;
  const sealedCount = stats?.sealedSets ?? 0;
  const ownedCount = stats?.ownedSets ?? 0;
  const unbuiltCount = Math.max(0, ownedCount - builtCount - sealedCount);
  const buildTotal = builtCount + sealedCount + unbuiltCount;

  const buildStatuses = [
    { label: "Built", count: builtCount, color: "#10B981" },
    { label: "Sealed", count: sealedCount, color: "#3B82F6" },
    { label: "Unbuilt", count: unbuiltCount, color: "#F59E0B" },
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

      {/* Collection Breakdown - Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Collection Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !stats?.themeBreakdown || stats.themeBreakdown.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              Add sets to see your theme breakdown
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.themeBreakdown}
                  dataKey="count"
                  nameKey="theme"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""} (${value ?? 0})`}
                  labelLine
                >
                  {stats.themeBreakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [value, name]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Collection Timeline - Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Collection Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !stats?.yearBreakdown || stats.yearBreakdown.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              Add sets to see your collection timeline
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.yearBreakdown}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [value, "Sets"]}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Build Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Build Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-16 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : buildTotal === 0 ? (
            <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
              No owned sets to show build status
            </div>
          ) : (
            <div className="space-y-3">
              {/* Horizontal stacked bar */}
              <div className="flex h-6 w-full overflow-hidden rounded-full">
                {buildStatuses.map(
                  (status) =>
                    status.count > 0 && (
                      <div
                        key={status.label}
                        className="transition-all duration-300"
                        style={{
                          width: `${(status.count / buildTotal) * 100}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    )
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                {buildStatuses.map((status) => (
                  <div key={status.label} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {status.label}
                    </span>
                    <span className="text-sm font-semibold">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
