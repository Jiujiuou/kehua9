import { useMemo } from "react";
import PropTypes from "prop-types";
import styles from "./HourlyActivityRiver.module.less";

/**
 * 24小时活跃度河流图
 * 使用 SVG 曲线展示一天中的活跃度分布
 */
const HourlyActivityRiver = ({ hourlyStats, mostActiveHour }) => {
  const renderData = useMemo(() => {
    if (!Array.isArray(hourlyStats) || hourlyStats.length === 0) {
      return null;
    }

    const maxCount = Math.max(...hourlyStats.map((s) => s.count || 0), 1);

    const viewBoxWidth = 1000;
    const viewBoxHeight = 240;
    const padding = { top: 50, bottom: 40, left: 50, right: 50 };
    const chartWidth = viewBoxWidth - padding.left - padding.right;
    const chartHeight = viewBoxHeight - padding.top - padding.bottom;

    const points = hourlyStats.map((stat, index) => {
      const x = padding.left + (index / 23) * chartWidth;
      const normalizedHeight = maxCount > 0 ? (stat.count || 0) / maxCount : 0;
      // 最小保留一点高度，视觉更稳定
      const height = normalizedHeight * chartHeight * 0.85 + chartHeight * 0.05;
      const y = padding.top + chartHeight - height;

      return {
        x,
        y,
        hour: stat.hour,
        count: stat.count || 0,
        normalizedHeight,
      };
    });

    // 使用三次贝塞尔 + Catmull-Rom 控制点生成平滑曲线
    let pathD = `M ${points[0].x} ${viewBoxHeight - padding.bottom}`;
    pathD += ` L ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const prev = i > 0 ? points[i - 1] : current;
      const nextNext = i < points.length - 2 ? points[i + 2] : next;

      const smoothness = 0.2;
      const cp1x = current.x + (next.x - prev.x) * smoothness;
      const cp1y = current.y + (next.y - prev.y) * smoothness;
      const cp2x = next.x - (nextNext.x - current.x) * smoothness;
      const cp2y = next.y - (nextNext.y - current.y) * smoothness;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    const lastPoint = points[points.length - 1];
    pathD += ` L ${lastPoint.x} ${viewBoxHeight - padding.bottom}`;
    pathD += ` Z`;

    const peakPoint = mostActiveHour
      ? points.find((p) => p.hour === mostActiveHour.hour)
      : points.reduce((max, p) => (p.count > max.count ? p : max), points[0]);

    const timeMarkers = [0, 6, 12, 18, 24].map((hour) => ({
      hour,
      x: padding.left + (hour / 24) * chartWidth,
      y: viewBoxHeight - padding.bottom + 30,
    }));

    return {
      viewBoxWidth,
      viewBoxHeight,
      pathD,
      peakPoint,
      timeMarkers,
      padding,
      chartHeight,
    };
  }, [hourlyStats, mostActiveHour]);

  if (!renderData) {
    return <div className={styles.emptyState}>暂无数据</div>;
  }

  const {
    viewBoxWidth,
    viewBoxHeight,
    pathD,
    peakPoint,
    timeMarkers,
    padding,
    chartHeight,
  } = renderData;

  return (
    <div className={styles.riverContainer}>
      <svg
        className={styles.riverSvg}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(234, 66, 95, 0.8)" />
            <stop offset="50%" stopColor="rgba(234, 66, 95, 0.5)" />
            <stop offset="100%" stopColor="rgba(234, 66, 95, 0.15)" />
          </linearGradient>
        </defs>

        <path
          d={pathD}
          fill="url(#riverGradient)"
          stroke="rgba(234, 66, 95, 0.6)"
          strokeWidth="1.5"
          className={styles.riverPath}
        />

        {peakPoint && (
          <g className={styles.peakMarker}>
            <line
              x1={peakPoint.x}
              y1={peakPoint.y}
              x2={peakPoint.x}
              y2={peakPoint.y - 30}
              stroke="rgba(234, 66, 95, 0.4)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            <circle
              cx={peakPoint.x}
              cy={peakPoint.y}
              r="4"
              fill="#EA425F"
              stroke="#ffffff"
              strokeWidth="2"
            />

            <text
              x={peakPoint.x}
              y={peakPoint.y - 35}
              textAnchor="middle"
              className={styles.peakLabel}
            >
              <tspan className={styles.peakTime}>{peakPoint.hour}:00</tspan>
              <tspan dx="8" className={styles.peakCount}>
                {peakPoint.count} 条
              </tspan>
            </text>
          </g>
        )}

        {timeMarkers.map((marker) => (
          <g key={marker.hour} className={styles.timeMarker}>
            <line
              x1={marker.x}
              y1={padding.top + chartHeight}
              x2={marker.x}
              y2={padding.top + chartHeight + 8}
              stroke="rgba(0, 0, 0, 0.15)"
              strokeWidth="1"
            />
            <text
              x={marker.x}
              y={marker.y}
              textAnchor="middle"
              className={styles.timeLabel}
            >
              {marker.hour}:00
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

HourlyActivityRiver.propTypes = {
  hourlyStats: PropTypes.arrayOf(
    PropTypes.shape({
      hour: PropTypes.number,
      count: PropTypes.number,
    })
  ),
  mostActiveHour: PropTypes.shape({
    hour: PropTypes.number,
    count: PropTypes.number,
  }),
};

export default HourlyActivityRiver;
