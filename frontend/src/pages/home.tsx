import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartBarBig } from "lucide-react";

type DashboardStats = {
  total_urls: number;
  total_pings: number;
  downtime_minutes: number;
  uptime_percent: number;
  avg_status: number;
};

type Ping = {
  id: number;
  name: string;
  url: string;
  status_code: number;
  time_checked_at: string;
};

export default function HomePage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [pings, setPings] = React.useState<Ping[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      const [statsRes, pingsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/pings"),
      ]);

      const statsJson = await statsRes.json();
      const pingsJson = await pingsRes.json();

      setStats(statsJson);
      setPings(pingsJson);
      setLoading(false);
    };

    fetchStats().catch((err) => {
      console.error("Failed to load dashboard:", err);
      setLoading(false);
    });
  }, []);

  const chartData = React.useMemo(() => {
    console.log(pings);
    if (!Array.isArray(pings) || pings.length === 0) return [];
    const grouped: { [minute: string]: Ping[] } = {};
    for (const ping of pings) {
      const time = new Date(ping.time_checked_at);
      const minute = new Date(
        time.getFullYear(),
        time.getMonth(),
        time.getDate(),
        time.getHours(),
        time.getMinutes()
      ).toISOString();

      if (!grouped[minute]) grouped[minute] = [];
      grouped[minute].push(ping);
    }

    return Object.entries(grouped).map(([timestamp, group]) => {
      const avgStatus =
        group.reduce((acc, p) => acc + (p.status_code || 0), 0) / group.length;
      const errorCount = group.filter((p) => p.status_code >= 400).length;

      return {
        time: new Date(timestamp),
        avgStatusCode: Math.round(avgStatus),
        errorCount,
      };
    });
  }, [pings]);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold flex flex-row items-center justify-center gap-2">
        <ChartBarBig /> Uptime Dock Dashboard
      </h1>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {stats && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total URLs</CardTitle>
                  <CardDescription>{stats.total_urls}</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Pings</CardTitle>
                  <CardDescription>{stats.total_pings}</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Downtime (min)</CardTitle>
                  <CardDescription>{stats.downtime_minutes}</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Uptime %</CardTitle>
                  <CardDescription>{stats.uptime_percent}%</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Avg Status Code</CardTitle>
                  <CardDescription>{stats.avg_status}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Global Status Overview</CardTitle>
              <CardDescription>
                Average status code and error count over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[300px] w-full"
                config={{
                  avgStatusCode: {
                    label: "Avg Status",
                    color: "#4ade80",
                  },
                  errorCount: {
                    label: "Errors",
                    color: "#f87171",
                  },
                }}
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={["auto", "auto"]}
                    scale="time"
                    tickFormatter={(val: Date) =>
                      new Date(val).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                  />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[180px]"
                        nameKey="avgStatusCode"
                        labelFormatter={(val: Date) =>
                          new Date(val).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        }
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="avgStatusCode"
                    stroke="#4ade80"
                    dot={{ r: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="errorCount"
                    stroke="#f87171"
                    dot={{ r: 1 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
