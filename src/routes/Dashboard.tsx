import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/data/store";
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
import {
  Box,
  Puzzle,
  Users,
  DollarSign,
  Plus,
  ScanBarcode,
  PackageOpen,
} from "lucide-react";

const COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const sets = useAppStore((s) => s.sets);
  const getStats = useAppStore((s) => s.getStats);

  const stats = useMemo(() => getStats(), [sets, getStats]);

  const hasSets = sets.length > 0;

  const ownedSets = useMemo(
    () => sets.filter((s) => s.status === "owned"),
    [sets]
  );

  const buildCounts = useMemo(() => {
    const built = ownedSets.filter((s) => s.buildStatus === "built").length;
    const sealed = ownedSets.filter((s) => s.buildStatus === "sealed").length;
    const unbuilt = ownedSets.filter(
      (s) => s.buildStatus === "unbuilt" || s.buildStatus === "partial"
    ).length;
    const total = built + sealed + unbuilt;
    return { built, sealed, unbuilt, total };
  }, [ownedSets]);

  if (!hasSets) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <PackageOpen className="h-20 w-20 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-bold">Hello, Collector!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your collection is empty. Add your first LEGO set to get started!
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/search")}>
            <Plus className="mr-2 h-4 w-4" />
            Add a Set
          </Button>
          <Button variant="outline" onClick={() => navigate("/scan")}>
            <ScanBarcode className="mr-2 h-4 w-4" />
            Scan Barcode
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold">Hello, Collector!</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Box className="h-6 w-6 text-amber-500" />
            <span className="text-2xl font-bold">{stats.totalSets}</span>
            <span className="text-xs text-muted-foreground">Total Sets</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Puzzle className="h-6 w-6 text-blue-500" />
            <span className="text-2xl font-bold">
              {stats.totalPieces.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">Total Pieces</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Users className="h-6 w-6 text-green-500" />
            <span className="text-2xl font-bold">{stats.totalMinifigs}</span>
            <span className="text-xs text-muted-foreground">Minifigs</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <DollarSign className="h-6 w-6 text-purple-500" />
            <span className="text-2xl font-bold">
              ${stats.estimatedValue.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">Est. Value</span>
          </CardContent>
        </Card>
      </div>

      {/* Build Status Bar */}
      {buildCounts.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Build Status</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {buildCounts.built > 0 && (
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${(buildCounts.built / buildCounts.total) * 100}%`,
                  }}
                />
              )}
              {buildCounts.sealed > 0 && (
                <div
                  className="bg-blue-500 transition-all"
                  style={{
                    width: `${(buildCounts.sealed / buildCounts.total) * 100}%`,
                  }}
                />
              )}
              {buildCounts.unbuilt > 0 && (
                <div
                  className="bg-amber-500 transition-all"
                  style={{
                    width: `${(buildCounts.unbuilt / buildCounts.total) * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                Built ({buildCounts.built})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                Sealed ({buildCounts.sealed})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                Unbuilt ({buildCounts.unbuilt})
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Breakdown Pie Chart */}
      {stats.themeBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Themes Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.themeBreakdown}
                  dataKey="count"
                  nameKey="theme"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {stats.themeBreakdown.map((_, i) => (
                    <Cell
                      key={`theme-${i}`}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Year Breakdown Bar Chart */}
      {stats.yearBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sets by Year</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.yearBreakdown}>
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => navigate("/search")}>
          <Plus className="mr-2 h-4 w-4" />
          Add a Set
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => navigate("/scan")}
        >
          <ScanBarcode className="mr-2 h-4 w-4" />
          Scan Barcode
        </Button>
      </div>
    </div>
  );
}
