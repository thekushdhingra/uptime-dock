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

type Ping = {
  id: number;
  name: string;
  url: string;
  status_code: number;
  time_checked_at: string;
};

type URLChartProps = {
  url: string;
};

export function URLStats({ url }: URLChartProps) {
  const [data, setData] = React.useState<Ping[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/pings?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch pings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const chartData = React.useMemo(() => {
    return data
      .map((p) => ({
        ...p,
        time: new Date(p.time_checked_at),
      }))
      .reverse();
  }, [data]);

  const stats = React.useMemo(() => {
    if (data.length === 0) return null;

    const totalChecks = data.length;
    const downPings = data.filter((p) => p.status_code >= 400);
    const timesDown = downPings.length;
    const avgStatusCode = Math.round(
      data.reduce((acc, p) => acc + p.status_code, 0) / data.length
    );

    const firstCheck = new Date(data[data.length - 1].time_checked_at);
    const lastDown = downPings.length
      ? new Date(downPings[0].time_checked_at)
      : null;

    // Rough downtime calculation
    let downtimeMinutes = 0;
    let longestDowntime = 0;
    let currentDowntime = 0;

    for (let i = 1; i < data.length; i++) {
      const isDown = data[i].status_code >= 400;
      const prevIsDown = data[i - 1].status_code >= 400;

      if (isDown && prevIsDown) {
        const gap =
          (new Date(data[i].time_checked_at).getTime() -
            new Date(data[i - 1].time_checked_at).getTime()) /
          60000;

        downtimeMinutes += gap;
        currentDowntime += gap;
        longestDowntime = Math.max(longestDowntime, currentDowntime);
      } else {
        currentDowntime = 0;
      }
    }

    const uptimePercent = ((totalChecks - timesDown) / totalChecks) * 100;

    return {
      totalChecks,
      timesDown,
      downtimeMinutes: Math.round(downtimeMinutes),
      uptimePercent: uptimePercent.toFixed(1),
      avgStatusCode,
      firstCheck,
      lastDown,
      longestDowntime: Math.round(longestDowntime),
    };
  }, [data]);

  return (
    <div className="grid gap-6">
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Checks</CardTitle>
              <CardDescription>{stats.totalChecks}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Downtimes</CardTitle>
              <CardDescription>{stats.timesDown}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Downtime (min)</CardTitle>
              <CardDescription>{stats.downtimeMinutes}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Uptime %</CardTitle>
              <CardDescription>{stats.uptimePercent}%</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg Status Code</CardTitle>
              <CardDescription>{stats.avgStatusCode}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>First Check</CardTitle>
              <CardDescription>
                {stats.firstCheck.toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Last Downtime</CardTitle>
              <CardDescription>
                {stats.lastDown
                  ? stats.lastDown.toLocaleString()
                  : "Never went down"}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Longest Downtime (min)</CardTitle>
              <CardDescription>{stats.longestDowntime}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status for: {url}</CardTitle>
          <CardDescription>HTTP status codes over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading chart...</p>
          ) : (
            <ChartContainer
              className="h-[300px] w-full"
              config={{
                status_code: {
                  label: "Status Code",
                  color: "var(--chart-1)",
                },
              }}
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(val: Date) =>
                    val.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  type="number"
                  domain={["auto", "auto"]}
                  scale="time"
                />
                <YAxis domain={["auto", "auto"]} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[180px]"
                      nameKey="status_code"
                      labelFormatter={(val: Date) =>
                        val.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="status_code"
                  stroke="#06b05c"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
