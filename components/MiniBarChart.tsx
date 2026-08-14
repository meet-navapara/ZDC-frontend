"use client";

import { useEffect, useMemo, useState } from "react";

export type ChartPoint = {
  date: string;
  count?: number;
  amount?: number;
  b2c?: number;
  b2b?: number;
  [k: string]: string | number | undefined;
};

function shortDay(iso: string) {
  // 2026-08-14 → Aug 14
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso.slice(5);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isToday(iso: string) {
  const today = new Date().toISOString().slice(0, 10);
  return iso === today;
}

function sumKey(data: ChartPoint[], key: string) {
  return data.reduce((acc, d) => acc + Number(d[key] ?? 0), 0);
}

function maxKey(data: ChartPoint[], key: string) {
  return Math.max(0, ...data.map((d) => Number(d[key] ?? 0)));
}

/** Shared card: big “latest” readout + readable chart + last days list. */
export function ChartPanel({
  title,
  subtitle,
  data,
  valueKey = "count",
  formatValue = (n: number) => String(n),
  loading,
  emptyHint,
  chart = "bar",
  dual = false,
  updatedAt,
}: {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  valueKey?: string;
  formatValue?: (n: number) => string;
  loading?: boolean;
  emptyHint?: string;
  chart?: "bar" | "line";
  dual?: boolean;
  updatedAt?: Date | null;
}) {
  const total = useMemo(() => {
    if (dual) return sumKey(data, "b2c") + sumKey(data, "b2b");
    return sumKey(data, valueKey);
  }, [data, dual, valueKey]);

  const latest = data.length ? data[data.length - 1] : null;
  const latestValue = latest
    ? dual
      ? Number(latest.b2c ?? 0) + Number(latest.b2b ?? 0)
      : Number(latest[valueKey] ?? 0)
    : 0;
  const peak = dual
    ? Math.max(0, ...data.map((d) => Number(d.b2c ?? 0) + Number(d.b2b ?? 0)))
    : maxKey(data, valueKey);
  const hasSignal = total > 0;
  const recent = [...data].slice(-7).reverse();

  return (
    <div className="card rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-sage-dark">
            {latest && isToday(latest.date) ? "Today" : "Latest day"}
          </div>
          <div className="font-display text-2xl font-semibold text-ink">
            {loading ? "—" : formatValue(latestValue)}
          </div>
          {updatedAt && (
            <div className="mt-0.5 text-[10px] text-ink-muted">
              Updated {updatedAt.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-muted">
        <span>
          Period total:{" "}
          <strong className="text-ink">{loading ? "—" : formatValue(total)}</strong>
        </span>
        <span>
          Peak day:{" "}
          <strong className="text-ink">{loading ? "—" : formatValue(peak)}</strong>
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-44 animate-pulse rounded-xl bg-ink/5" />
        ) : !hasSignal ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 bg-paper-100/60 px-4 text-center">
            <p className="text-sm font-medium text-ink">No activity in this period yet</p>
            <p className="mt-1 max-w-sm text-xs text-ink-muted">
              {emptyHint ||
                "When real purchases or try-ons happen, this chart fills with live day-by-day numbers."}
            </p>
          </div>
        ) : dual ? (
          <DualBarChart data={data as { date: string; b2c: number; b2b: number }[]} height={180} />
        ) : chart === "line" ? (
          <MiniLineChart
            data={data}
            valueKey={valueKey}
            height={180}
            formatValue={formatValue}
          />
        ) : (
          <MiniBarChart
            data={data}
            valueKey={valueKey}
            height={180}
            formatValue={formatValue}
          />
        )}
      </div>

      {/* Easy-to-scan last 7 days — solves “hard to identify” bars */}
      {!loading && hasSignal && (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10">
          <div className="grid grid-cols-[1fr_auto] gap-2 bg-ink/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>Day</span>
            <span>Value</span>
          </div>
          <ul className="divide-y divide-ink/5">
            {recent.map((d) => {
              const v = dual
                ? Number(d.b2c ?? 0) + Number(d.b2b ?? 0)
                : Number(d[valueKey] ?? 0);
              const today = isToday(d.date);
              return (
                <li
                  key={d.date}
                  className={`grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 text-sm ${
                    today ? "bg-sage/10" : ""
                  }`}
                >
                  <span className="text-ink">
                    {shortDay(d.date)}
                    {today ? (
                      <span className="ml-2 rounded-full bg-sage/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-dark">
                        Today
                      </span>
                    ) : null}
                    {dual ? (
                      <span className="ml-2 text-xs text-ink-muted">
                        B2C {d.b2c ?? 0} · B2B {d.b2b ?? 0}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-semibold text-ink">{formatValue(v)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Readable bar chart with Y labels + highlighted latest bar + value on peak/latest.
 */
export function MiniBarChart({
  data,
  height = 180,
  valueKey = "count",
  colorClass = "fill-sage/80",
  formatValue,
  ariaLabel = "Bar chart",
}: {
  data: ChartPoint[];
  height?: number;
  valueKey?: string;
  colorClass?: string;
  formatValue?: (n: number) => string;
  ariaLabel?: string;
}) {
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(1, ...values);
  const width = 640;
  const left = 36;
  const right = 8;
  const top = 18;
  const bottom = 28;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const gap = 5;
  const barW = data.length ? (chartW - gap * (data.length - 1)) / data.length : 0;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((t) => {
        const y = top + chartH - (t / max) * chartH;
        return (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="#1A1A1A"
              strokeOpacity="0.08"
            />
            <text
              x={left - 6}
              y={y + 3}
              textAnchor="end"
              fill="#6B7280"
              style={{ fontSize: 10 }}
            >
              {formatValue ? formatValue(t) : t}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const value = Number(d[valueKey] ?? 0);
        const h = value === 0 ? 3 : Math.max(4, Math.round((value / max) * chartH));
        const x = left + i * (barW + gap);
        const y = top + chartH - h;
        const latest = i === data.length - 1;
        const showLabel =
          latest || i % Math.max(1, Math.ceil(data.length / 6)) === 0;
        const tip = formatValue ? formatValue(value) : String(value);
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={4}
              className={latest ? "fill-sage" : colorClass}
              opacity={latest ? 1 : 0.85}
            >
              <title>{`${shortDay(d.date)}: ${tip}`}</title>
            </rect>
            {(latest || value === max) && value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fill="#1A1A1A"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {tip}
              </text>
            )}
            {showLabel && (
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                fill={latest ? "#2F5D50" : "#6B7280"}
                style={{ fontSize: 10, fontWeight: latest ? 700 : 400 }}
              >
                {shortDay(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function MiniLineChart({
  data,
  height = 180,
  valueKey = "amount",
  stroke = "#2F5D50",
  fill = "rgba(47,93,80,0.14)",
  formatValue,
  ariaLabel = "Line chart",
}: {
  data: ChartPoint[];
  height?: number;
  valueKey?: string;
  stroke?: string;
  fill?: string;
  formatValue?: (n: number) => string;
  ariaLabel?: string;
}) {
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(1, ...values);
  const width = 640;
  const left = 40;
  const right = 12;
  const top = 18;
  const bottom = 28;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const step = data.length > 1 ? chartW / (data.length - 1) : chartW;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));

  const points = data.map((d, i) => {
    const value = Number(d[valueKey] ?? 0);
    const x = left + i * step;
    const y = top + chartH - (value / max) * chartH;
    return { x, y, value, date: d.date };
  });

  const line =
    points.length === 0
      ? ""
      : points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area =
    points.length === 0
      ? ""
      : `${line} L${points[points.length - 1].x},${top + chartH} L${points[0].x},${top + chartH} Z`;

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((t) => {
        const y = top + chartH - (t / max) * chartH;
        return (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="#1A1A1A"
              strokeOpacity="0.08"
            />
            <text
              x={left - 6}
              y={y + 3}
              textAnchor="end"
              fill="#6B7280"
              style={{ fontSize: 10 }}
            >
              {formatValue ? formatValue(t) : t}
            </text>
          </g>
        );
      })}
      <path d={area} fill={fill} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => {
        const latest = i === points.length - 1;
        const showLabel =
          latest || i % Math.max(1, Math.ceil(data.length / 6)) === 0;
        const tip = formatValue ? formatValue(p.value) : String(p.value);
        return (
          <g key={p.date}>
            <circle
              cx={p.x}
              cy={p.y}
              r={latest ? 5 : 3}
              fill={stroke}
              stroke="#FAF8F4"
              strokeWidth={latest ? 2 : 0}
            >
              <title>{`${shortDay(p.date)}: ${tip}`}</title>
            </circle>
            {showLabel && (
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill={latest ? "#2F5D50" : "#6B7280"}
                style={{ fontSize: 10, fontWeight: latest ? 700 : 400 }}
              >
                {shortDay(p.date)}
              </text>
            )}
          </g>
        );
      })}
      {last && last.value > 0 && (
        <text
          x={Math.min(last.x + 8, width - right)}
          y={last.y - 8}
          fill="#1A1A1A"
          style={{ fontSize: 11, fontWeight: 700 }}
        >
          {formatValue ? formatValue(last.value) : last.value}
        </text>
      )}
    </svg>
  );
}

export function DualBarChart({
  data,
  height = 180,
  ariaLabel = "B2C vs B2B try-ons",
}: {
  data: { date: string; b2c: number; b2b: number }[];
  height?: number;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.b2c + d.b2b));
  const width = 640;
  const left = 28;
  const right = 8;
  const top = 12;
  const bottom = 28;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const gap = 5;
  const barW = data.length ? (chartW - gap * (data.length - 1)) / data.length : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      {data.map((d, i) => {
        const x = left + i * (barW + gap);
        const b2bH = d.b2b ? Math.max(4, Math.round((d.b2b / max) * chartH)) : 0;
        const b2cH = d.b2c ? Math.max(4, Math.round((d.b2c / max) * chartH)) : 0;
        const latest = i === data.length - 1;
        const showLabel =
          latest || i % Math.max(1, Math.ceil(data.length / 6)) === 0;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={top + chartH - b2bH}
              width={barW}
              height={b2bH}
              rx={3}
              className="fill-sage/85"
            >
              <title>{`${shortDay(d.date)} B2B: ${d.b2b}`}</title>
            </rect>
            <rect
              x={x}
              y={top + chartH - b2bH - b2cH}
              width={barW}
              height={b2cH}
              rx={3}
              className="fill-ink/40"
            >
              <title>{`${shortDay(d.date)} B2C: ${d.b2c}`}</title>
            </rect>
            {showLabel && (
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                fill={latest ? "#2F5D50" : "#6B7280"}
                style={{ fontSize: 10, fontWeight: latest ? 700 : 400 }}
              >
                {shortDay(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Auto-refresh helper for live dashboards. */
export function useLiveRefresh(ms = 30000) {
  const [tick, setTick] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return {
    tick,
    updatedAt,
    markUpdated: () => setUpdatedAt(new Date()),
  };
}
