"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#38bdf8", "#34d399", "#a78bfa", "#fbbf24", "#fb7185", "#94a3b8"];

export type ComboPoint = {
  label: string;
  revenueVnd: number;
  bookingCount: number;
  paymentSuccessCount: number;
  conversionRatePercent: number;
};

/** Doanh thu (area) + số đơn (line) — tooltip có thêm tỷ lệ TT/đơn */
export function DashboardComboChart({ data }: { data: ComboPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    revenueTriệu: d.revenueVnd / 1_000_000,
  }));

  return (
    <div className="h-[320px] w-full min-h-[320px] min-w-0">
      {chartData.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Không có dữ liệu trong khoảng đã chọn.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-slate-200 dark:stroke-slate-700"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-slate-500"
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              className="text-slate-500"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                `${Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}`
              }
              label={{
                value: "Triệu ₫",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10, fill: "#64748b" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              className="text-slate-500"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              label={{
                value: "Đơn",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 10, fill: "#64748b" },
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as ComboPoint & {
                  revenueTriệu: number;
                };
                return (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-900">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {label}
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                      <li>
                        Doanh thu:{" "}
                        <span className="font-medium text-sky-600 dark:text-sky-400">
                          {row.revenueTriệu.toLocaleString("vi-VN", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          triệu
                        </span>
                      </li>
                      <li>
                        Đơn đặt:{" "}
                        <span className="font-medium tabular-nums text-slate-900 dark:text-white">
                          {row.bookingCount}
                        </span>
                      </li>
                      <li>
                        TT thành công:{" "}
                        <span className="tabular-nums">{row.paymentSuccessCount}</span>
                      </li>
                      <li>
                        TT/đơn (ước lượng):{" "}
                        <span className="font-medium text-violet-600 dark:text-violet-400">
                          {row.conversionRatePercent}%
                        </span>
                      </li>
                    </ul>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenueTriệu"
              name="Doanh thu (triệu)"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#dashRevGrad)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bookingCount"
              name="Số đơn"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function MiniSparkline({
  values,
  color = "#38bdf8",
}: {
  values: number[];
  color?: string;
}) {
  const data = values.map((v, i) => ({ i, v }));
  if (data.length === 0) return <div className="h-8 w-full" />;
  return (
    <div className="h-8 w-full min-w-[4rem]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export function BookingStatusDonut({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: STATUS_LABEL[key] ?? key,
      value,
    }));
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">Chưa có đơn.</p>
    );
  }
  return (
    <div className="h-[220px] w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `${Number(value ?? 0).toLocaleString("vi-VN")} đơn`,
              "",
            ]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RegionBookingsPie({
  rows,
}: {
  rows: { regionName: string; bookingCount: number }[];
}) {
  const data = rows.map((r) => ({
    name: r.regionName,
    value: r.bookingCount,
  }));
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Chưa có đơn gắn miền.
      </p>
    );
  }
  return (
    <div className="h-[220px] w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `${Number(value ?? 0).toLocaleString("vi-VN")} đơn`,
              "Đặt tour",
            ]}
            contentStyle={{ borderRadius: "12px" }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayBookingBar({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="h-[200px] w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-700"
            vertical={false}
          />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [
              `${Number(v ?? 0).toLocaleString("vi-VN")} đơn`,
              "Booking",
            ]}
            contentStyle={{ borderRadius: "12px" }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.count >= max * 0.85
                    ? "#f97316"
                    : entry.count >= max * 0.5
                      ? "#38bdf8"
                      : "#cbd5e1"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SupplierTypeBar({
  rows,
}: {
  rows: { type: string; count: number }[];
}) {
  const data = rows.map((r) => ({
    name:
      r.type === "TRANSPORT"
        ? "Xe / VC"
        : r.type === "HOTEL"
          ? "Khách sạn"
          : r.type === "RESTAURANT"
            ? "Nhà hàng"
            : r.type === "GUIDE"
              ? "Hướng dẫn"
              : r.type === "ACTIVITY"
                ? "Hoạt động"
                : r.type,
    count: r.count,
  }));
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">Chưa có NCC.</p>
    );
  }
  return (
    <div className="h-[180px] w-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-700"
            horizontal={false}
          />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [
              `${Number(v ?? 0).toLocaleString("vi-VN")} NCC`,
              "",
            ]}
            contentStyle={{ borderRadius: "12px" }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Thanh tỉ lệ trạng thái — trực quan “phễu” phân bổ đơn */
export function BookingStatusFunnel({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  const order = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
  const total = order.reduce((s, k) => s + (breakdown[k] ?? 0), 0);
  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">Chưa có đơn.</p>
    );
  }
  const max = Math.max(...order.map((k) => breakdown[k] ?? 0), 1);
  return (
    <div className="space-y-3">
      {order.map((key) => {
        const n = breakdown[key] ?? 0;
        const w = Math.max(8, (n / max) * 100);
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{STATUS_LABEL[key]}</span>
              <span className="tabular-nums font-medium text-slate-900 dark:text-white">
                {n.toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
