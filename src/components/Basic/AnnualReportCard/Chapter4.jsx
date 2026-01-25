import { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  filterDynamicsToAnnualReportRange,
  getDynamicType,
} from "@/utils/annualReport";
import styles from "./Chapter4.module.less";

// ========== 字数季节变化 & 相册里的温度（内置于 Chapter4，不依赖 mock 目录） ==========

const getMonthFromDynamic = (dynamic) => {
  if (!dynamic) return null;

  if (dynamic?.date) {
    // YYYY-MM-DD
    const m = String(dynamic.date).split("-")[1];
    const month = parseInt(m, 10);
    if (!Number.isNaN(month) && month >= 1 && month <= 12) return month;
  }

  if (dynamic?.timestamp) {
    const date = new Date(dynamic.timestamp);
    if (!Number.isNaN(date.getTime())) return date.getMonth() + 1;
  }

  return null;
};

const getSeasonByMonth = (month) => {
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "autumn";
  return "winter"; // 12, 1, 2
};

const getSeasonName = (season) => {
  if (season === "spring") return "春天";
  if (season === "summer") return "夏天";
  if (season === "autumn") return "秋天";
  return "冬天";
};

const getSeasonWarmText = (season) => {
  switch (season) {
    case "spring":
      return "如初芽破土，带着试探的勇气。";
    case "summer":
      return "似夏日骤雨，热烈而毫无保留。";
    case "autumn":
      return "像秋日长空，疏朗中藏着深意。";
    case "winter":
      return "若冬日炉火，将万千思绪收于寥寥数语。";
    default:
      return "每个季节，都有它独特的表达方式。";
  }
};

// 添加个性化评语
const getPersonalRemark = (avgChars) => {
  if (avgChars < 50) return "你懂得留白的艺术。";
  if (avgChars < 150) return "恰到好处的表达，是成年人的体面。";
  if (avgChars < 300) return "细致而克制，这是你的表达风格。";
  return "如此丰沛的表达，定有丰沛的内心。";
};

const calculateMonthlyTextStats = (dynamics = []) => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalChars: 0,
    textCount: 0,
    avgChars: 0,
    season: getSeasonByMonth(i + 1),
  }));

  if (!Array.isArray(dynamics) || dynamics.length === 0) return months;

  dynamics.forEach((d) => {
    const text = typeof d?.text === "string" ? d.text.trim() : "";
    if (!text) return;

    const month = getMonthFromDynamic(d);
    if (!month) return;

    const idx = month - 1;
    months[idx].totalChars += text.length;
    months[idx].textCount += 1;
  });

  months.forEach((m) => {
    m.avgChars = m.textCount > 0 ? Math.round(m.totalChars / m.textCount) : 0;
  });

  return months;
};

const calculateSeasonAverages = (monthlyStats = []) => {
  const acc = {
    spring: { season: "spring", total: 0, count: 0 },
    summer: { season: "summer", total: 0, count: 0 },
    autumn: { season: "autumn", total: 0, count: 0 },
    winter: { season: "winter", total: 0, count: 0 },
  };

  monthlyStats.forEach((m) => {
    if (!m || !m.season) return;
    if (m.avgChars <= 0) return;

    acc[m.season].total += m.avgChars;
    acc[m.season].count += 1;
  });

  const list = Object.values(acc)
    .map((s) => ({
      ...s,
      avg: s.count > 0 ? Number((s.total / s.count).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  return list;
};

const calculateAlbumTemperature = (dynamics = []) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return {
      total: 0,
      textOnly: 0,
      imageOrMixed: 0,
      videoOrMixed: 0,
      mediaAny: 0,
      prefer: "text",
      mediaRatio: 0,
      textRatio: 0,
      imageRatioInMedia: 0,
      videoRatioInMedia: 0,
    };
  }

  const stats = {
    total: dynamics.length,
    textOnly: 0,
    imageOrMixed: 0,
    videoOrMixed: 0,
    mediaAny: 0,
  };

  dynamics.forEach((d) => {
    const type = getDynamicType(d);
    if (type === "text") stats.textOnly += 1;

    const hasImages = Array.isArray(d?.images) && d.images.length > 0;
    const hasVideos = Array.isArray(d?.videos) && d.videos.length > 0;

    if (hasImages || hasVideos) stats.mediaAny += 1;
    if (hasImages) stats.imageOrMixed += 1;
    if (hasVideos) stats.videoOrMixed += 1;
  });

  const mediaRatio = Number(((stats.mediaAny / stats.total) * 100).toFixed(1));
  const textRatio = Number(((stats.textOnly / stats.total) * 100).toFixed(1));

  const prefer = stats.mediaAny > stats.textOnly ? "media" : "text";

  const denom = stats.mediaAny || 1;
  const imageRatioInMedia = Number(
    ((stats.imageOrMixed / denom) * 100).toFixed(1),
  );
  const videoRatioInMedia = Number(
    ((stats.videoOrMixed / denom) * 100).toFixed(1),
  );

  return {
    ...stats,
    prefer,
    mediaRatio,
    textRatio,
    imageRatioInMedia,
    videoRatioInMedia,
  };
};

const generateChapterText = ({ monthlyStats, seasonAverages, albumStats }) => {
  const texts = [];

  const hasAnyText = Array.isArray(monthlyStats)
    ? monthlyStats.some((m) => (m?.avgChars || 0) > 0)
    : false;

  if (hasAnyText) {
    const peakMonth = monthlyStats
      .filter((m) => (m?.avgChars || 0) > 0)
      .reduce(
        (max, m) => (m.avgChars > max.avgChars ? m : max),
        monthlyStats[0],
      );

    const topSeason = Array.isArray(seasonAverages) ? seasonAverages[0] : null;
    const seasonName = getSeasonName(topSeason?.season);

    // 优化主标题
    texts.push({
      type: "main",
      text: "字是会呼吸的",
    });

    // 月度峰值文案优化
    if (peakMonth?.month) {
      texts.push({
        type: "normal",
        text: `在${peakMonth.month}月，你的表达最为绵密——平均每条${peakMonth.avgChars}字。当数字攀升至此，便不只是记录，而是某种倾注。`,
      });

      // 添加个性化评语
      const remark = getPersonalRemark(peakMonth.avgChars);
      if (remark) {
        texts.push({
          type: "normal",
          text: remark,
        });
      }
    }

    if (topSeason?.avg > 0) {
      texts.push({
        type: "normal",
        text: `如果把这一年分成四季，你的“表达强度”在${seasonName}最明显（均值${topSeason.avg}字）。${getSeasonWarmText(
          topSeason.season,
        )}`,
      });
    }
  } else {
    // 无文字数据的优雅处理
    texts.push({
      type: "main",
      text: "安静，也是一种表达",
    });
    texts.push({
      type: "normal",
      text: "这一年，你选择了更轻的方式——有些感受，本就不必落在纸上。",
    });
  }

  if (albumStats?.total > 0) {
    const preferText =
      albumStats.prefer === "media"
        ? "你更习惯用画面定格瞬间"
        : "你更习惯让文字替你保存";

    texts.push({
      type: "main",
      text: "相册的温度",
    });

    texts.push({
      type: "normal",
      text: `${preferText}：这一年里，${albumStats.textRatio}%的动态是纯文字，仅${albumStats.mediaRatio}%附上了画面。画面留住瞬间，文字留住感受。`,
    });

    if (albumStats.mediaAny > 0) {
      texts.push({
        type: "normal",
        text: `在你的“画面记录”里，图片占比${albumStats.imageRatioInMedia}%，视频占比${albumStats.videoRatioInMedia}%。你选择的载体，也在替你说话。`,
      });
    }
  }

  return texts;
};

// ========== 手绘温度曲线组件 ==========
const BreathingCurveChart = ({ monthlyStats = [], maxAvgChars = 1 }) => {
  const canvasRef = useRef(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 季节颜色配置（温和、符合年度报告主题）
  const seasonColors = {
    spring: {
      // 春天：柔和的嫩绿色，如初芽
      main: "rgba(120, 180, 140, 0.75)",
      fill: "rgba(120, 180, 140, 0.15)",
      light: "rgba(120, 180, 140, 0.3)",
      glow: "rgba(120, 180, 140, 0.35)",
    },
    summer: {
      // 夏天：柔和的粉红色，与主题色呼应
      main: "rgba(235, 150, 170, 0.75)",
      fill: "rgba(235, 150, 170, 0.15)",
      light: "rgba(235, 150, 170, 0.3)",
      glow: "rgba(235, 150, 170, 0.35)",
    },
    autumn: {
      // 秋天：柔和的暖棕色，如秋叶
      main: "rgba(200, 160, 120, 0.75)",
      fill: "rgba(200, 160, 120, 0.15)",
      light: "rgba(200, 160, 120, 0.3)",
      glow: "rgba(200, 160, 120, 0.35)",
    },
    winter: {
      // 冬天：柔和的灰蓝色，如冬日天空
      main: "rgba(140, 160, 180, 0.75)",
      fill: "rgba(140, 160, 180, 0.15)",
      light: "rgba(140, 160, 180, 0.3)",
      glow: "rgba(140, 160, 180, 0.35)",
    },
  };

  // 生成手绘抖动效果（固定随机种子，确保每次渲染一致）
  const addHandDrawnJitter = (x, y, intensity = 0.5, seed = 0) => {
    const random = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const rx = random(x * 100 + seed);
    const ry = random(y * 100 + seed + 1000);
    return {
      x: x + (rx - 0.5) * intensity,
      y: y + (ry - 0.5) * intensity,
    };
  };

  // Catmull-Rom样条插值
  const catmullRom = (t, p0, p1, p2, p3) => {
    if (!p0 || !p1 || !p2 || !p3) {
      return { x: p1?.x || 0, y: p1?.y || 0 };
    }
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x:
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y:
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
  };

  // 绘制春天元素：花瓣
  const drawSpringPetal = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = seasonColors.spring.main;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = seasonColors.spring.light;
    ctx.fill();
    ctx.restore();
  };

  // 绘制春天元素：嫩芽
  const drawSpringBud = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.quadraticCurveTo(-size * 0.5, size * 0.3, -size * 0.3, 0);
    ctx.quadraticCurveTo(0, -size * 0.2, size * 0.3, 0);
    ctx.quadraticCurveTo(size * 0.5, size * 0.3, 0, size);
    ctx.closePath();
    ctx.fillStyle = seasonColors.spring.main;
    ctx.fill();
    ctx.restore();
  };

  // 绘制夏天元素：星星
  const drawSummerStar = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.8;
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = seasonColors.summer.main;
    ctx.fill();
    ctx.shadowBlur = 4;
    ctx.shadowColor = seasonColors.summer.glow;
    ctx.fill();
    ctx.restore();
  };

  // 绘制夏天元素：光点
  const drawSummerSparkle = (ctx, x, y, size) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = seasonColors.summer.light;
    ctx.fill();
    ctx.strokeStyle = seasonColors.summer.main;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - size * 2, y);
    ctx.lineTo(x + size * 2, y);
    ctx.moveTo(x, y - size * 2);
    ctx.lineTo(x, y + size * 2);
    ctx.stroke();
    ctx.restore();
  };

  // 绘制秋天元素：枫叶
  const drawAutumnLeaf = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(-size * 0.3, size * 0.5);
    ctx.lineTo(-size * 0.6, size * 0.2);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.2, -size * 0.3);
    ctx.lineTo(0, -size * 0.5);
    ctx.lineTo(size * 0.2, -size * 0.3);
    ctx.lineTo(size * 0.4, 0);
    ctx.lineTo(size * 0.6, size * 0.2);
    ctx.lineTo(size * 0.3, size * 0.5);
    ctx.closePath();
    ctx.fillStyle = seasonColors.autumn.main;
    ctx.fill();
    ctx.strokeStyle = seasonColors.autumn.light;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(0, -size * 0.5);
    ctx.stroke();
    ctx.restore();
  };

  // 绘制秋天元素：果实
  const drawAutumnFruit = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = seasonColors.autumn.main;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = seasonColors.autumn.light;
    ctx.fill();
  };

  // 绘制冬天元素：雪花
  const drawWinterSnowflake = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.8;
    const branches = 6;
    for (let i = 0; i < branches; i++) {
      const angle = (Math.PI * 2 * i) / branches;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
      ctx.strokeStyle = seasonColors.winter.main;
      ctx.lineWidth = 1;
      ctx.stroke();
      const branchLength = size * 0.4;
      const branchAngle1 = angle + Math.PI / 6;
      const branchAngle2 = angle - Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * size * 0.6, Math.sin(angle) * size * 0.6);
      ctx.lineTo(
        Math.cos(angle) * size * 0.6 + Math.cos(branchAngle1) * branchLength,
        Math.sin(angle) * size * 0.6 + Math.sin(branchAngle1) * branchLength,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * size * 0.6, Math.sin(angle) * size * 0.6);
      ctx.lineTo(
        Math.cos(angle) * size * 0.6 + Math.cos(branchAngle2) * branchLength,
        Math.sin(angle) * size * 0.6 + Math.sin(branchAngle2) * branchLength,
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = seasonColors.winter.main;
    ctx.fill();
    ctx.restore();
  };

  // 绘制冬天元素：冰晶
  const drawWinterCrystal = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(size * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = seasonColors.winter.light;
    ctx.fill();
    ctx.strokeStyle = seasonColors.winter.main;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !monthlyStats || monthlyStats.length === 0) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = 140;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const padding = { top: 25, bottom: 35, left: 25, right: 25 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const monthWidth = chartWidth / 11;

    const points = monthlyStats.map((m, index) => {
      const x = padding.left + index * monthWidth;
      const normalizedHeight = maxAvgChars > 0 ? m.avgChars / maxAvgChars : 0;
      const y = padding.top + chartHeight - normalizedHeight * chartHeight;
      return {
        x,
        y,
        month: m.month,
        avgChars: m.avgChars,
        season: m.season,
      };
    });

    // 绘制填充区域
    const fillPoints = [];
    fillPoints.push({ x: padding.left, y: padding.top + chartHeight });

    if (points.length === 0) {
      fillPoints.push({ x: padding.left, y: padding.top + chartHeight });
    } else if (points.length === 1) {
      fillPoints.push({ x: points[0].x, y: points[0].y });
    } else {
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          fillPoints.push({ x: points[i].x, y: points[i].y });
        } else {
          const p0 = i > 1 ? points[i - 2] : points[i - 1];
          const p1 = points[i - 1];
          const p2 = points[i];
          const p3 = i < points.length - 1 ? points[i + 1] : points[i];

          if (p0 && p1 && p2 && p3) {
            const segments = 15;
            for (let j = 0; j <= segments; j++) {
              const t = j / segments;
              const point = catmullRom(t, p0, p1, p2, p3);
              fillPoints.push({ x: point.x, y: point.y });
            }
          }
        }
      }
    }

    fillPoints.push({
      x: padding.left + chartWidth,
      y: padding.top + chartHeight,
    });

    // 分段填充
    for (let i = 0; i < fillPoints.length - 1; i++) {
      const currentPoint = fillPoints[i];
      const nextPoint = fillPoints[i + 1];
      const pointIndex = Math.min(
        Math.floor((i / fillPoints.length) * points.length),
        points.length - 1,
      );
      const point = points[pointIndex];
      const color = seasonColors[point?.season] || seasonColors.spring;

      const gradient = ctx.createLinearGradient(
        currentPoint.x,
        currentPoint.y,
        currentPoint.x,
        padding.top + chartHeight,
      );
      gradient.addColorStop(0, color.fill);
      gradient.addColorStop(0.5, color.fill.replace("0.18", "0.1"));
      gradient.addColorStop(1, color.fill.replace("0.18", "0.05"));

      ctx.beginPath();
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.lineTo(nextPoint.x, padding.top + chartHeight);
      ctx.lineTo(currentPoint.x, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 绘制曲线
    if (points.length >= 2) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 2;
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";

      let currentSeason = points[0]?.season;
      ctx.beginPath();
      ctx.strokeStyle =
        seasonColors[currentSeason]?.main || seasonColors.spring.main;

      const jitteredFirst = addHandDrawnJitter(
        points[0].x,
        points[0].y,
        0.4,
        0,
      );
      ctx.moveTo(jitteredFirst.x, jitteredFirst.y);

      for (let i = 1; i < points.length; i++) {
        const point = points[i];

        if (point.season !== currentSeason) {
          ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle =
            seasonColors[point.season]?.main || seasonColors.spring.main;
          const prevPoint = points[i - 1];
          const jitteredPrev = addHandDrawnJitter(
            prevPoint.x,
            prevPoint.y,
            0.4,
            i - 1,
          );
          ctx.moveTo(jitteredPrev.x, jitteredPrev.y);
          currentSeason = point.season;
        }

        const p0 = i > 1 ? points[i - 2] : points[i - 1];
        const p1 = points[i - 1];
        const p2 = point;
        const p3 = i < points.length - 1 ? points[i + 1] : point;

        if (p0 && p1 && p2 && p3) {
          const segments = 15;
          for (let j = 1; j <= segments; j++) {
            const t = j / segments;
            const pt = catmullRom(t, p0, p1, p2, p3);
            const jittered = addHandDrawnJitter(pt.x, pt.y, 0.4, i * 100 + j);
            ctx.lineTo(jittered.x, jittered.y);
          }
        }
      }

      ctx.stroke();
      ctx.restore();
    }

    // 绘制数据点和季节元素
    points.forEach((point, index) => {
      const color = seasonColors[point.season] || seasonColors.spring;

      const glowGradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        8,
      );
      glowGradient.addColorStop(0, color.glow);
      glowGradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color.main;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (hoveredMonth === point.month) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = color.main;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const elementIntensity = Math.max(0.3, point.avgChars / maxAvgChars);
      const elementCount = Math.max(1, Math.floor(elementIntensity * 4));

      for (let i = 0; i < elementCount; i++) {
        const angle = (Math.PI * 2 * i) / elementCount;
        const radius = 12 + (i % 3) * 3;
        const offsetX = point.x + Math.cos(angle) * radius;
        const offsetY = point.y - 15 - Math.sin(angle) * radius;
        const rotation = (i * Math.PI) / 4;

        if (point.season === "spring") {
          if (i % 2 === 0) {
            drawSpringPetal(ctx, offsetX, offsetY, 3, rotation);
          } else {
            drawSpringBud(ctx, offsetX, offsetY, 2.5, rotation);
          }
        } else if (point.season === "summer") {
          if (i % 2 === 0) {
            drawSummerStar(ctx, offsetX, offsetY, 3, rotation);
          } else {
            drawSummerSparkle(ctx, offsetX, offsetY, 1.5);
          }
        } else if (point.season === "autumn") {
          if (i % 2 === 0) {
            drawAutumnLeaf(ctx, offsetX, offsetY, 3, rotation);
          } else {
            drawAutumnFruit(ctx, offsetX, offsetY, 2);
          }
        } else {
          if (i % 2 === 0) {
            drawWinterSnowflake(ctx, offsetX, offsetY, 3, rotation);
          } else {
            drawWinterCrystal(ctx, offsetX, offsetY, 2, rotation);
          }
        }
      }
    });

    // 绘制月份标签
    points.forEach((point) => {
      ctx.fillStyle = "var(--text-secondary)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(point.month, point.x, height - 12);
    });

    // 绘制悬停提示
    if (hoveredMonth !== null) {
      const hoveredPoint = points.find((p) => p.month === hoveredMonth);
      if (hoveredPoint) {
        const tipX = hoveredPoint.x;
        const tipY = hoveredPoint.y - 25;
        const tipText = `${hoveredPoint.month}月：平均${hoveredPoint.avgChars}字`;
        const textWidth = ctx.measureText(tipText).width;
        const padding = 8;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        const bgX = tipX - textWidth / 2 - padding;
        const bgY = tipY - 18;
        const bgW = textWidth + padding * 2;
        const bgH = 22;
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(bgX + radius, bgY);
        ctx.lineTo(bgX + bgW - radius, bgY);
        ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
        ctx.lineTo(bgX + bgW, bgY + bgH - radius);
        ctx.quadraticCurveTo(
          bgX + bgW,
          bgY + bgH,
          bgX + bgW - radius,
          bgY + bgH,
        );
        ctx.lineTo(bgX + radius, bgY + bgH);
        ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
        ctx.lineTo(bgX, bgY + radius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tipText, tipX, tipY - 7);

        ctx.beginPath();
        ctx.moveTo(tipX, tipY + 4);
        ctx.lineTo(tipX - 5, tipY + 9);
        ctx.lineTo(tipX + 5, tipY + 9);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyStats, maxAvgChars, hoveredMonth]);

  // 鼠标事件处理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;
      const x = (e.clientX - rect.left) / scaleX;
      const y = (e.clientY - rect.top) / scaleY;

      setMousePos({ x: e.clientX, y: e.clientY });

      const padding = { top: 25, bottom: 35, left: 25, right: 25 };
      const chartWidth = rect.width - padding.left - padding.right;
      const chartHeight = 140 - padding.top - padding.bottom;
      const monthWidth = chartWidth / 11;

      let hovered = null;
      let minDistance = Infinity;

      monthlyStats.forEach((m, index) => {
        const pointX = padding.left + index * monthWidth;
        const normalizedHeight = maxAvgChars > 0 ? m.avgChars / maxAvgChars : 0;
        const pointY =
          padding.top + chartHeight - normalizedHeight * chartHeight;
        const distance = Math.sqrt(
          Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2),
        );
        if (distance < 20 && distance < minDistance) {
          minDistance = distance;
          hovered = m.month;
        }
      });

      setHoveredMonth(hovered);
    };

    const handleMouseLeave = () => {
      setHoveredMonth(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [monthlyStats, maxAvgChars]);

  return (
    <div className={styles.chartContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: hoveredMonth ? "pointer" : "default" }}
      />
    </div>
  );
};

BreathingCurveChart.propTypes = {
  monthlyStats: PropTypes.array,
  maxAvgChars: PropTypes.number,
};

const Chapter4 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showText, setShowText] = useState(false);
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");

  const SUBTITLE_TEXT = "字里行间的温度，藏在十二个月的起落中";

  const { monthlyStats, albumStats, textList } = useMemo(() => {
    const filtered = filterDynamicsToAnnualReportRange(dynamics);

    const monthlyStats = calculateMonthlyTextStats(filtered);
    const seasonAverages = calculateSeasonAverages(monthlyStats);
    const albumStats = calculateAlbumTemperature(filtered);

    const textList = generateChapterText({
      monthlyStats,
      seasonAverages,
      albumStats,
    });

    return { monthlyStats, albumStats, textList };
  }, [dynamics]);

  const maxAvgChars = useMemo(() => {
    const max = Math.max(
      ...(monthlyStats || []).map((m) => m.avgChars || 0),
      0,
    );
    return max > 0 ? max : 1;
  }, [monthlyStats]);

  // 打字机效果
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 100; // 每个字符的延迟（毫秒）
    let typingTimer = null;
    let initialDelayTimer = null;

    const typeText = () => {
      if (currentIndex < SUBTITLE_TEXT.length) {
        setDisplayedSubtitle(SUBTITLE_TEXT.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimer = setTimeout(typeText, typingSpeed);
      } else {
        // 文字显示完成后，显示后续内容
        setShowCharts(true);
        setTimeout(() => setShowText(true), 200);
      }
    };

    // 先显示标题
    const timer1 = setTimeout(() => setShowTitle(true), 300);

    // 标题显示后500ms再开启打字机效果
    initialDelayTimer = setTimeout(() => {
      setShowSubtitle(true);
      typeText();
    }, 800);

    return () => {
      if (timer1) clearTimeout(timer1);
      if (typingTimer) clearTimeout(typingTimer);
      if (initialDelayTimer) clearTimeout(initialDelayTimer);
    };
  }, []);

  return (
    <div className={styles.chapter4Content}>
      <div
        className={`${styles.chapter4Title} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        表达的季节
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter4Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          {displayedSubtitle}
          {displayedSubtitle.length < SUBTITLE_TEXT.length && (
            <span className={styles.cursor}>|</span>
          )}
        </div>
      )}

      {showCharts && (
        <div
          className={`${styles.charts} ${showCharts ? styles.fadeIn : styles.hidden}`}
        >
          <div className={styles.sectionTitle}>字数的起伏</div>

          <BreathingCurveChart
            monthlyStats={monthlyStats}
            maxAvgChars={maxAvgChars}
          />

          <div className={styles.legend}>
            <span className={`${styles.legendDot} ${styles.dot_spring}`} /> 春
            <span className={`${styles.legendDot} ${styles.dot_summer}`} /> 夏
            <span className={`${styles.legendDot} ${styles.dot_autumn}`} /> 秋
            <span className={`${styles.legendDot} ${styles.dot_winter}`} /> 冬
          </div>

          <div className={styles.sectionTitle}>相册里的温度</div>
          <div className={styles.albumCard}>
            <div className={styles.albumRow}>
              <div className={styles.albumLabel}>含影像的动态</div>
              <div className={styles.albumValue}>{albumStats.mediaRatio}%</div>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${albumStats.mediaRatio}%` }}
              />
            </div>

            <div className={styles.albumRow}>
              <div className={styles.albumLabel}>纯文字</div>
              <div className={styles.albumValue}>{albumStats.textRatio}%</div>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFillMuted}
                style={{ width: `${albumStats.textRatio}%` }}
              />
            </div>

            {albumStats.mediaAny > 0 && (
              <div className={styles.mediaSplit}>
                <div className={styles.mediaSplitItem}>
                  <div className={styles.mediaSplitTop}>
                    <span className={styles.mediaSplitName}>图片</span>
                    <span className={styles.mediaSplitPct}>
                      {albumStats.imageRatioInMedia}%
                    </span>
                  </div>
                  <div className={styles.progressTrackSmall}>
                    <div
                      className={styles.progressFillImage}
                      style={{ width: `${albumStats.imageRatioInMedia}%` }}
                    />
                  </div>
                </div>

                <div className={styles.mediaSplitItem}>
                  <div className={styles.mediaSplitTop}>
                    <span className={styles.mediaSplitName}>视频</span>
                    <span className={styles.mediaSplitPct}>
                      {albumStats.videoRatioInMedia}%
                    </span>
                  </div>
                  <div className={styles.progressTrackSmall}>
                    <div
                      className={styles.progressFillVideo}
                      style={{ width: `${albumStats.videoRatioInMedia}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(textList) && textList.length > 0 && (
        <div
          className={`${styles.textSection} ${
            showText ? styles.fadeIn : styles.hidden
          }`}
        >
          {textList.map((item, index) => (
            <div
              key={index}
              className={`${styles.textItem} ${
                item?.type === "main" ? styles.mainText : styles.normalText
              }`}
            >
              {item?.text}
            </div>
          ))}
        </div>
      )}
      {/* 底部间距，确保内容不被裁剪 */}
      <div style={{ height: "32px", width: "100%", flexShrink: 0 }} />
    </div>
  );
};

Chapter4.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter4;
