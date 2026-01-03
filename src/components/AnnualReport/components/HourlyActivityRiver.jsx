import { useMemo } from "react";
import PropTypes from "prop-types";
import styles from "./HourlyActivityRiver.module.less";

/**
 * 24小时活跃度河流图
 * 使用渐变色带展示一天中的活跃度分布
 */
const HourlyActivityRiver = ({ hourlyStats, mostActiveHour }) => {
  // 计算渲染数据
  const renderData = useMemo(() => {
    if (!hourlyStats || hourlyStats.length === 0) {
      return null;
    }

    // 找出最大值用于归一化
    const maxCount = Math.max(...hourlyStats.map((s) => s.count), 1);

    // SVG viewBox 设置
    const viewBoxWidth = 1000;
    const viewBoxHeight = 240;
    const padding = { top: 50, bottom: 40, left: 50, right: 50 };
    const chartWidth = viewBoxWidth - padding.left - padding.right;
    const chartHeight = viewBoxHeight - padding.top - padding.bottom;

    // 生成路径点
    const points = hourlyStats.map((stat, index) => {
      const x = padding.left + (index / 23) * chartWidth;
      // 归一化高度，最小保留 10% 的高度
      const normalizedHeight = maxCount > 0 ? stat.count / maxCount : 0;
      const height = normalizedHeight * chartHeight * 0.85 + chartHeight * 0.05;
      const y = padding.top + chartHeight - height;

      return { x, y, hour: stat.hour, count: stat.count, normalizedHeight };
    });

    // 生成超级平滑的 path（使用三次贝塞尔曲线）
    let pathD = `M ${points[0].x} ${viewBoxHeight - padding.bottom}`;
    pathD += ` L ${points[0].x} ${points[0].y}`;

    // 生成平滑曲线 - 使用 Catmull-Rom 样条的控制点
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // 获取前一个点和后一个点用于计算平滑控制点
      const prev = i > 0 ? points[i - 1] : current;
      const nextNext = i < points.length - 2 ? points[i + 2] : next;

      // 计算控制点（使控制点更接近线段，让曲线更平滑）
      const smoothness = 0.2; // 平滑度系数，值越小越平滑
      const cp1x = current.x + (next.x - prev.x) * smoothness;
      const cp1y = current.y + (next.y - prev.y) * smoothness;
      const cp2x = next.x - (nextNext.x - current.x) * smoothness;
      const cp2y = next.y - (nextNext.y - current.y) * smoothness;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    // 闭合路径
    const lastPoint = points[points.length - 1];
    pathD += ` L ${lastPoint.x} ${viewBoxHeight - padding.bottom}`;
    pathD += ` Z`;

    // 找到最活跃的点
    const peakPoint = mostActiveHour
      ? points.find((p) => p.hour === mostActiveHour.hour)
      : points.reduce((max, p) => (p.count > max.count ? p : max), points[0]);

    // 时间刻度标记
    const timeMarkers = [0, 6, 12, 18, 24].map((hour) => ({
      hour,
      x: padding.left + (hour / 24) * chartWidth,
      y: viewBoxHeight - padding.bottom + 30,
    }));

    return {
      viewBoxWidth,
      viewBoxHeight,
      pathD,
      points,
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
        {/* 渐变定义 */}
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(234, 66, 95, 0.8)" />
            <stop offset="50%" stopColor="rgba(234, 66, 95, 0.5)" />
            <stop offset="100%" stopColor="rgba(234, 66, 95, 0.15)" />
          </linearGradient>
        </defs>

        {/* 河流路径 */}
        <path
          d={pathD}
          fill="url(#riverGradient)"
          stroke="rgba(234, 66, 95, 0.6)"
          strokeWidth="1.5"
          className={styles.riverPath}
        />

        {/* 最活跃点标记 */}
        {peakPoint && (
          <g className={styles.peakMarker}>
            {/* 垂直虚线 */}
            <line
              x1={peakPoint.x}
              y1={peakPoint.y}
              x2={peakPoint.x}
              y2={peakPoint.y - 30}
              stroke="rgba(234, 66, 95, 0.4)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            {/* 圆点 */}
            <circle
              cx={peakPoint.x}
              cy={peakPoint.y}
              r="4"
              fill="#EA425F"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* 标注文字 - 水平排布 */}
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

        {/* 时间刻度 */}
        {timeMarkers.map((marker) => (
          <g key={marker.hour} className={styles.timeMarker}>
            {/* 刻度线 */}
            <line
              x1={marker.x}
              y1={padding.top + chartHeight}
              x2={marker.x}
              y2={padding.top + chartHeight + 8}
              stroke="rgba(0, 0, 0, 0.15)"
              strokeWidth="1"
            />

            {/* 时间文字 */}
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
