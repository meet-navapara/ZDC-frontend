"use client";

// A tiny dependency-free SVG bar chart for daily counts. Kept intentionally
// simple so we avoid heavy charting libs and any React 19 peer-dep friction.
export function MiniBarChart({
  data,
  height = 160,
}: {
  data: { date: string; count: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barGap = 4;
  const width = 640;
  const barWidth = data.length
    ? (width - barGap * (data.length - 1)) / data.length
    : 0;
  const chartH = height - 24; // leave room for x labels

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Try-ons per day"
    >
      {data.map((d, i) => {
        const h = d.count === 0 ? 2 : Math.round((d.count / max) * chartH);
        const x = i * (barWidth + barGap);
        const y = chartH - h;
        const showLabel = i % Math.ceil(data.length / 7) === 0;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={3}
              className="fill-sage/70"
            >
              <title>{`${d.date}: ${d.count}`}</title>
            </rect>
            {showLabel && (
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-ink-muted"
                style={{ fontSize: 10 }}
              >
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
