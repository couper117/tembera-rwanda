/**
 * A sparkline, drawn by hand.
 *
 * A charting library would be several hundred kilobytes for one line on one
 * screen; this is an SVG path over a normalised series, and it inherits the
 * theme because its colours are the accent tokens rather than a baked palette.
 */
export default function TrendChart({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const width = 100;
  const height = 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  // A flat series would divide by zero; give it a nominal range instead.
  const span = max - min || 1;

  const points = values.map((value, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((value - min) / span) * (height - 6) - 3,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      className="a-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Trend: ${values.join(", ")}`}
    >
      <path className="a-chart__area" d={area} />
      <path className="a-chart__line" d={line} vectorEffect="non-scaling-stroke" />
      {/* The endpoint is the number people actually look for. */}
      <circle className="a-chart__dot" cx={last.x} cy={last.y} r="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
