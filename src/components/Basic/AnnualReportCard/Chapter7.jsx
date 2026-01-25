import { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  filterDynamicsToAnnualReportRange,
  formatMonthDay,
  getDateStringFromDynamic,
  getTimeStringFromDynamic,
  parseDateStringToUTC,
} from "@/utils/annualReport";
import YearCalendar from "./YearCalendar";
import styles from "./Chapter7.module.less";

import {
  HOLIDAYS,
  HOLIDAY_NAMES,
  SEASON_NAMES,
  WEEK_DAY_NAMES,
  WEEK_DAY_PREFIXES,
  ANNUAL_REPORT_END_DATE,
} from "@/constant";

const truncateText = (text, maxLen = 80) => {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}...`;
};

const getFirstSentence = (text) => {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (!t) return "";
  const parts = t.split(/[。！？.!?\n]/).map((s) => s.trim());
  const first = parts.find((s) => s.length > 0);
  return first || truncateText(t, 50);
};

const calculateActiveDates = (dynamics) => {
  const set = new Set();

  (Array.isArray(dynamics) ? dynamics : []).forEach((dynamic) => {
    const dateStr = getDateStringFromDynamic(dynamic);
    if (dateStr) set.add(dateStr);
  });

  return Array.from(set).sort();
};

const calculateLongestStreak = (activeDates) => {
  if (!Array.isArray(activeDates) || activeDates.length === 0) return 0;

  const dayMs = 24 * 60 * 60 * 1000;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < activeDates.length; i++) {
    const prev = parseDateStringToUTC(activeDates[i - 1]);
    const cur = parseDateStringToUTC(activeDates[i]);
    if (prev === null || cur === null) continue;

    if (cur - prev === dayMs) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
};

const calculateMostActiveWeekday = (dynamics) => {
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const counts = new Array(7).fill(0);

  (Array.isArray(dynamics) ? dynamics : []).forEach((dynamic) => {
    const dateStr = getDateStringFromDynamic(dynamic);
    if (!dateStr) return;

    // 使用本地时区即可，展示上更贴近用户习惯
    const dt = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return;

    counts[dt.getDay()]++;
  });

  let maxIndex = 0;
  for (let i = 1; i < 7; i++) {
    if (counts[i] > counts[maxIndex]) maxIndex = i;
  }

  const total = counts.reduce((a, b) => a + b, 0);

  return {
    dayName: names[maxIndex],
    count: counts[maxIndex],
    percentage:
      total > 0 ? Number(((counts[maxIndex] / total) * 100).toFixed(1)) : 0,
  };
};

const generateCalendarText = ({
  companionDays,
  longestStreak,
  mostActiveWeekday,
  year,
}) => {
  const texts = [];

  // 相关内容已删除，只保留空数组
  // 如果需要显示日历相关的其他文案，可以在这里添加

  return texts;
};

const buildDateToDynamicsMap = (dynamics) => {
  const map = new Map();

  (Array.isArray(dynamics) ? dynamics : []).forEach((d) => {
    const dateStr = getDateStringFromDynamic(d);
    if (!dateStr) return;

    if (!map.has(dateStr)) map.set(dateStr, []);
    map.get(dateStr).push(d);
  });

  // 保证每天内部按时间排序
  for (const list of map.values()) {
    list.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));
  }

  return map;
};

const findSilenceMoment = ({ activeDatesAll, reportYear }) => {
  // 选取“重新开始日期在 reportYear 内”的最长间隔
  if (!Array.isArray(activeDatesAll) || activeDatesAll.length < 2) {
    return { silenceDays: 0, lastDateStr: null, restartDateStr: null };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const isInYear = (dateStr) => String(dateStr).startsWith(`${reportYear}-`);

  let best = { silenceDays: 0, lastDateStr: null, restartDateStr: null };

  for (let i = 1; i < activeDatesAll.length; i++) {
    const prevStr = activeDatesAll[i - 1];
    const curStr = activeDatesAll[i];

    if (!isInYear(curStr)) continue;

    const prevUTC = parseDateStringToUTC(prevStr);
    const curUTC = parseDateStringToUTC(curStr);
    if (prevUTC === null || curUTC === null) continue;

    const diffDays = Math.round((curUTC - prevUTC) / dayMs);
    if (diffDays > best.silenceDays) {
      best = {
        silenceDays: diffDays,
        lastDateStr: prevStr,
        restartDateStr: curStr,
      };
    }
  }

  return best;
};

const buildSilenceTexts = ({
  silenceDays,
  lastDateStr,
  restartDateStr,
  year,
  restartDayTextInfo,
}) => {
  const texts = [];

  // 兜底：没有足够数据形成静默
  if (!lastDateStr || !restartDateStr || silenceDays <= 0) {
    texts.push({
      type: "main",
      text: "这一年，你的记录几乎没有长时间的停歇。",
    });
    texts.push({
      type: "normal",
      text: "你的自我对话很稳定——这份持续的温柔，本身就很了不起。",
    });
    return texts;
  }

  const showYear = !String(lastDateStr).startsWith(`${year}-`);
  const lastText = formatMonthDay(lastDateStr, { alwaysShowYear: showYear });
  const restartText = formatMonthDay(restartDateStr, { alwaysShowYear: false });

  // 分层叙事
  if (silenceDays >= 1 && silenceDays <= 7) {
    texts.push({ type: "main", text: `你有 ${silenceDays} 天 没有打开日记。` });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 到 ${restartText}，生活可能像往常一样继续，\n只是你选择暂时不记录。`,
    });
    texts.push({
      type: "normal",
      text: "有时候，不表达也是一种表达。短暂的停歇让下一次记录更加真实。",
    });
    texts.push({
      type: "normal",
      text: "就像呼吸需要呼气后的那个停顿——停下，是为了更深的吸气。",
    });
  } else if (silenceDays >= 8 && silenceDays <= 30) {
    texts.push({
      type: "main",
      text: `${silenceDays} 天——这是你今年最长的记录间隔。`,
    });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 的最后一条记录，\n到 ${restartText} 的重新开始，\n将近一个月的时间里，日记本在安静等待。`,
    });
    texts.push({
      type: "normal",
      text: "也许那段日子，你正在经历某种内在的转变；\n也许日常的忙碌让你无暇内观；\n也许情绪太过复杂，难以言说。",
    });
    texts.push({
      type: "normal",
      text: `但重要的是，你在 ${restartText} 回来了。`,
    });
    texts.push({
      type: "normal",
      text: "空窗期不是空白期，而是内心的酝酿。就像土壤需要休耕，心灵也需要静默。",
    });
  } else if (silenceDays >= 31 && silenceDays <= 90) {
    texts.push({ type: "main", text: `${silenceDays} 天的静默。` });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 的告别，\n到 ${restartText} 的重启。`,
    });
    texts.push({
      type: "normal",
      text: "这段时间里，你可能经历了重要的变化，\n可能专注于现实的挑战，\n或者只是需要时间消化内心的波澜。",
    });
    texts.push({
      type: "normal",
      text: "这不是简单的回归，而是带着新的感悟归来。",
    });
    texts.push({
      type: "normal",
      text: "最长的停顿，往往带来最深的领悟。停下不是结束，而是蓄力。",
    });
  } else {
    texts.push({
      type: "main",
      text: `${silenceDays} 天的旅程，在日记本外发生。`,
    });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 到 ${restartText}，你度过了整整一个季节的静默。`,
    });
    texts.push({
      type: "normal",
      text: "这段时间里，你可能经历了一场漫长的内心跋涉；\n沉浸在生活的另一个维度；\n学会了用行动而非文字表达；\n需要完全的沉淀才能重新出发。",
    });
    texts.push({
      type: "normal",
      text: `在 ${restartText} 你写下的第一行字，\n不只是记录的继续，更是与过去自己的对话。`,
    });
    texts.push({
      type: "normal",
      text: "如此长的静默，足以让旧的自己落叶，新的自己破土。",
    });
  }

  // 特殊时段洞察（轻量版）
  const lastMonth = parseInt(String(lastDateStr).split("-")[1], 10);
  const restartMonth = parseInt(String(restartDateStr).split("-")[1], 10);
  const lastYear = parseInt(String(lastDateStr).split("-")[0], 10);
  const restartYear = parseInt(String(restartDateStr).split("-")[0], 10);

  if (lastYear !== restartYear && lastMonth === 12 && restartMonth === 1) {
    texts.push({
      type: "normal",
      text: "你的静默跨越了旧年与新年。\n从岁末的沉淀到新年的更新，\n你在时间的交界处完成了一次内在的更替。",
    });
  } else if (
    lastMonth >= 6 &&
    lastMonth <= 8 &&
    restartMonth >= 6 &&
    restartMonth <= 8
  ) {
    texts.push({
      type: "normal",
      text: "夏季的静默更像外向的生活。\n文字可以等待，但阳光与汗水不会。",
    });
  } else if (restartMonth >= 9 && restartMonth <= 11) {
    texts.push({
      type: "normal",
      text: "在秋天重新开始是一种智慧。\n把经历慢慢转化成文字，让成长有迹可循。",
    });
  }

  // 重新开始那天的内容洞察（只做轻量正向提示）
  if (restartDayTextInfo) {
    const { totalTextLength = 0, hasRestartKeywords = false } =
      restartDayTextInfo;

    if (totalTextLength > 0 && totalTextLength < 50) {
      texts.push({
        type: "normal",
        text: "重新开始的那天，你写得很简短。\n像是试探性的第一步，小心翼翼却又坚定地回归自我对话。",
      });
    } else if (totalTextLength > 200) {
      texts.push({
        type: "normal",
        text: "重新开始的那天，你写下了长长的文字。\n有些话，酝酿越久，表达越深。",
      });
    }

    if (hasRestartKeywords) {
      texts.push({
        type: "normal",
        text: "你在那天写下了“重新/再/继续”。\n这次暂停，对你来说是一场有意识的重新出发。",
      });
    }
  }

  texts.push({
    type: "normal",
    text: "给未来的自己：如果还会有这样的静默期，不必自责，不必着急。相信按下暂停键的你，也相信总会重新开始的你。",
  });

  return texts;
};

// Canvas 辅助函数
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawDashedLine = (ctx, x1, y1, x2, y2, color, lineWidth) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

const drawStar = (ctx, x, y, size) => {
  ctx.save();
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  let rot = (Math.PI / 2) * 3;
  let step = Math.PI / spikes;

  ctx.moveTo(x, y - outerRadius);
  for (let i = 0; i < spikes; i++) {
    const xPos = x + Math.cos(rot) * outerRadius;
    const yPos = y + Math.sin(rot) * outerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;

    const xPosInner = x + Math.cos(rot) * innerRadius;
    const yPosInner = y + Math.sin(rot) * innerRadius;
    ctx.lineTo(xPosInner, yPosInner);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawSparkle = (ctx, x, y, size) => {
  ctx.save();
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 1;

  // 绘制十字形状
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // 绘制中心点
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/**
 * Canvas 时间线组件
 */
const SilenceTimelineCanvas = ({
  lastDateStr,
  restartDateStr,
  silenceDays,
  showYearInTimeline,
  onLastDateClick,
  onRestartDateClick,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const layoutRef = useRef({
    startBoxX: 0,
    startBoxWidth: 0,
    endTextX: 0,
    endTextWidth: 0,
  });

  const drawTimeline = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const maxWidth = rect.width;
    const height = 80;

    // 计算实际宽度（不超过父元素）
    const padding = 16;
    const availableWidth = maxWidth - padding * 2;

    // 估算各部分的宽度
    const lastDateText = formatMonthDay(lastDateStr, {
      alwaysShowYear: showYearInTimeline,
    });
    const restartDateText = formatMonthDay(restartDateStr, {
      alwaysShowYear: false,
    });

    // 测量文本宽度
    ctx.font =
      "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const lastDateWidth = ctx.measureText(lastDateText).width;
    const restartDateWidth = ctx.measureText(restartDateText).width;
    const daysText = `${silenceDays}`;
    const daysLabelText = "天的静默";
    ctx.font =
      "800 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const daysValueWidth = ctx.measureText(daysText).width;
    ctx.font =
      "400 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const daysLabelWidth = ctx.measureText(daysLabelText).width;

    const startTextWidth = lastDateWidth + 20; // 文本 + 星形图标 + 间距
    const middleBoxWidth = Math.max(
      Math.max(daysValueWidth, daysLabelWidth) + 24,
      92,
    );
    const endTextWidth = restartDateWidth + 40;
    const lineGap = 12;
    const totalWidth =
      startTextWidth + lineGap + middleBoxWidth + lineGap + endTextWidth;

    const width = Math.min(totalWidth, availableWidth);
    const scale = width / totalWidth;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 颜色配置
    const colors = {
      darkBg: "rgba(51, 51, 51, 0.8)",
      accent: "rgba(234, 66, 95, 0.9)",
      accentLight: "rgba(234, 66, 95, 0.15)",
      accentBorder: "rgba(234, 66, 95, 0.22)",
      text: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.7)",
    };

    const centerY = height / 2;
    let currentX = 0;

    // 绘制开始日期（无背景框）
    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.font =
      "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(lastDateText, currentX, centerY);

    // 绘制星形图标（在日期文本右侧）
    const starX = currentX + lastDateWidth + 8;
    drawStar(ctx, starX, centerY, 6);

    // 保存布局信息用于点击检测
    layoutRef.current.startBoxX = currentX;
    layoutRef.current.startBoxWidth = lastDateWidth + 20;

    ctx.restore();

    currentX += lastDateWidth + 20 + lineGap * scale;

    // 绘制第一条连接线（虚线）
    const line1Length = (middleBoxWidth * scale) / 2;
    drawDashedLine(
      ctx,
      currentX - line1Length,
      centerY,
      currentX,
      centerY,
      colors.accent,
      2,
    );

    // 绘制中间静默天数框
    const middleBoxHeight = 50;
    const middleBoxY = centerY - middleBoxHeight / 2;
    const middleBoxWidthScaled = middleBoxWidth * scale;

    ctx.save();
    ctx.fillStyle = colors.accentLight;
    ctx.strokeStyle = colors.accentBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(
      ctx,
      currentX,
      middleBoxY,
      middleBoxWidthScaled,
      middleBoxHeight,
      12,
    );
    ctx.fill();
    ctx.stroke();

    // 天数数字
    ctx.fillStyle = colors.accent;
    ctx.font =
      "800 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      daysText,
      currentX + middleBoxWidthScaled / 2,
      middleBoxY + middleBoxHeight / 2 - 8,
    );

    // 天数标签
    ctx.fillStyle = colors.textSecondary;
    ctx.font =
      "400 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      daysLabelText,
      currentX + middleBoxWidthScaled / 2,
      middleBoxY + middleBoxHeight / 2 + 8,
    );
    ctx.restore();

    currentX += middleBoxWidthScaled + lineGap * scale;

    // 绘制第二条连接线（虚线）
    const line2Length = (endTextWidth * scale) / 2;
    drawDashedLine(
      ctx,
      currentX,
      centerY,
      currentX + line2Length,
      centerY,
      colors.accent,
      2,
    );

    // 绘制结束日期文本
    currentX += line2Length;
    layoutRef.current.endTextX = currentX;
    layoutRef.current.endTextWidth = restartDateWidth;

    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.font =
      "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(restartDateText, currentX, centerY);

    // 绘制闪烁图标（两个小星星）
    const sparkleSize = 4;
    const sparkleOffset = 8;
    drawSparkle(
      ctx,
      currentX + restartDateWidth + sparkleOffset,
      centerY - 4,
      sparkleSize,
    );
    drawSparkle(
      ctx,
      currentX + restartDateWidth + sparkleOffset + 10,
      centerY + 4,
      sparkleSize,
    );
    ctx.restore();
  };

  useEffect(() => {
    drawTimeline();

    // 监听窗口大小变化
    const handleResize = () => {
      drawTimeline();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [lastDateStr, restartDateStr, silenceDays, showYearInTimeline]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const height = 80;
    const centerY = height / 2;

    // 检查点击区域
    const { startBoxX, startBoxWidth, endTextX, endTextWidth } =
      layoutRef.current;

    if (
      x >= startBoxX &&
      x <= startBoxX + startBoxWidth &&
      Math.abs(y - centerY) < 25
    ) {
      onLastDateClick?.();
    } else if (
      x >= endTextX &&
      x <= endTextX + endTextWidth + 30 &&
      Math.abs(y - centerY) < 25
    ) {
      onRestartDateClick?.();
    }
  };

  return (
    <div ref={containerRef} className={styles.timelineCanvasContainer}>
      <canvas
        ref={canvasRef}
        className={styles.timelineCanvas}
        onClick={handleCanvasClick}
        style={{ cursor: "pointer" }}
      />
    </div>
  );
};

SilenceTimelineCanvas.propTypes = {
  lastDateStr: PropTypes.string,
  restartDateStr: PropTypes.string,
  silenceDays: PropTypes.number,
  showYearInTimeline: PropTypes.bool,
  onLastDateClick: PropTypes.func,
  onRestartDateClick: PropTypes.func,
};

const Chapter7 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSilence, setShowSilence] = useState(false);
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");

  const SUBTITLE_TEXT = "那些被你记录过的日期，会发光";

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const {
    year,
    yearDynamics,
    calendarText,
    silenceMoment,
    silenceTexts,
    dateToDynamics,
    restartHighlight,
  } = useMemo(() => {
    const filteredAll = filterDynamicsToAnnualReportRange(dynamics);

    const year =
      parseInt(String(ANNUAL_REPORT_END_DATE).slice(0, 4), 10) ||
      new Date().getFullYear();

    const yearDynamics = filteredAll.filter((d) => {
      const ds = getDateStringFromDynamic(d);
      return ds && String(ds).startsWith(`${year}-`);
    });

    const activeDatesInYear = calculateActiveDates(yearDynamics);
    const companionDays = activeDatesInYear.length;
    const longestStreak = calculateLongestStreak(activeDatesInYear);
    const mostActiveWeekday = calculateMostActiveWeekday(yearDynamics);

    const calendarText = generateCalendarText({
      companionDays,
      longestStreak,
      mostActiveWeekday,
      year,
    });

    const dateToDynamics = buildDateToDynamicsMap(filteredAll);
    const activeDatesAll = Array.from(dateToDynamics.keys()).sort();

    const silenceMoment = findSilenceMoment({
      activeDatesAll,
      reportYear: year,
    });

    const restartList = silenceMoment.restartDateStr
      ? dateToDynamics.get(silenceMoment.restartDateStr) || []
      : [];

    const restartFirst = restartList[0] || null;
    const restartFirstSentence = restartFirst?.text
      ? getFirstSentence(restartFirst.text)
      : "";

    const restartTotalTextLength = restartList.reduce((sum, d) => {
      const t = d?.text;
      return sum + (t && typeof t === "string" ? t.trim().length : 0);
    }, 0);

    const hasRestartKeywords = restartList.some((d) => {
      const t = d?.text;
      if (!t || typeof t !== "string") return false;
      return t.includes("重新") || t.includes("再") || t.includes("继续");
    });

    const restartDayTextInfo = {
      totalTextLength: restartTotalTextLength,
      hasRestartKeywords,
    };

    const silenceTexts = buildSilenceTexts({
      silenceDays: silenceMoment.silenceDays,
      lastDateStr: silenceMoment.lastDateStr,
      restartDateStr: silenceMoment.restartDateStr,
      year,
      restartDayTextInfo,
    });

    const restartHighlight = {
      dateStr: silenceMoment.restartDateStr,
      firstSentence: restartFirstSentence,
      totalTextLength: restartTotalTextLength,
      imagesCount: restartList.reduce(
        (sum, d) => sum + (Array.isArray(d?.images) ? d.images.length : 0),
        0,
      ),
      videosCount: restartList.reduce(
        (sum, d) => sum + (Array.isArray(d?.videos) ? d.videos.length : 0),
        0,
      ),
    };

    return {
      year,
      yearDynamics,
      calendarText,
      silenceMoment,
      silenceTexts,
      dateToDynamics,
      restartHighlight,
    };
  }, [dynamics]);

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
        // 文字显示完成后，等待一段时间再显示日历
        setTimeout(() => {
          setShowCalendar(true);
          // 日历显示后，再等待一段时间显示文案
          setTimeout(() => {
            setShowText(true);
            // 文案显示后，再等待一段时间显示静默部分
            setTimeout(() => {
              setShowSilence(true);
            }, 500);
          }, 1000);
        }, 600);
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

  const openDateModal = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setShowDateModal(true);
  };

  const selectedList = useMemo(() => {
    if (!selectedDate) return [];
    return dateToDynamics.get(selectedDate) || [];
  }, [dateToDynamics, selectedDate]);

  const showYearInTimeline = useMemo(() => {
    const last = silenceMoment?.lastDateStr;
    const restart = silenceMoment?.restartDateStr;
    if (!last || !restart) return false;

    const lastYear = parseInt(String(last).slice(0, 4), 10);
    const restartYear = parseInt(String(restart).slice(0, 4), 10);
    return lastYear !== restartYear;
  }, [silenceMoment]);

  return (
    <div className={styles.chapter7Content}>
      <div
        className={`${styles.chapter7Title} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        点亮的日子
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter7Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          {displayedSubtitle}
          {displayedSubtitle.length < SUBTITLE_TEXT.length && (
            <span className={styles.cursor}>|</span>
          )}
        </div>
      )}

      {/* 日历放在文案之前 */}
      <div
        className={`${styles.calendarSection} ${
          showCalendar ? styles.fadeIn : styles.hidden
        }`}
      >
        <YearCalendar dynamics={yearDynamics} year={year} />
      </div>

      {Array.isArray(calendarText) && calendarText.length > 0 && (
        <div
          className={`${styles.textSection} ${
            showText ? styles.fadeIn : styles.hidden
          }`}
        >
          {calendarText.map((item, index) => (
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

      {/* 你的静默时刻 */}
      <div
        className={`${styles.silenceSection} ${showSilence ? styles.fadeIn : styles.hidden}`}
      >
        <div className={styles.silenceHeader}>
          <div className={styles.silenceTitle}>你的静默时刻</div>
          <div className={styles.silenceSubtitle}>停下不是结束，而是蓄力</div>
        </div>

        {silenceMoment?.lastDateStr && silenceMoment?.restartDateStr ? (
          <SilenceTimelineCanvas
            lastDateStr={silenceMoment.lastDateStr}
            restartDateStr={silenceMoment.restartDateStr}
            silenceDays={silenceMoment.silenceDays}
            showYearInTimeline={showYearInTimeline}
            onLastDateClick={() => openDateModal(silenceMoment.lastDateStr)}
            onRestartDateClick={() =>
              openDateModal(silenceMoment.restartDateStr)
            }
          />
        ) : (
          <div className={styles.timelineEmpty}>
            这一年，你的记录节奏很平稳，几乎没有明显的长静默。
          </div>
        )}

        {Array.isArray(silenceTexts) && silenceTexts.length > 0 && (
          <div className={styles.silenceTextList}>
            {silenceTexts.map((item, idx) => (
              <div
                key={idx}
                className={`${styles.silenceTextItem} ${item?.type === "main" ? styles.silenceMainText : styles.silenceNormalText}`}
              >
                {String(item?.text || "")
                  .split("\n")
                  .map((line, lineIndex, arr) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < arr.length - 1 && <br />}
                    </span>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDateModal && (
        <div
          className={styles.dateModalOverlay}
          onClick={() => setShowDateModal(false)}
        >
          <div
            className={styles.dateModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dateModalHeader}>
              <div className={styles.dateModalTitle}>
                {selectedDate
                  ? formatMonthDay(selectedDate, { alwaysShowYear: true })
                  : "—"}
              </div>
              <button
                type="button"
                className={styles.dateModalClose}
                onClick={() => setShowDateModal(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {selectedList.length > 0 ? (
              <div className={styles.dateModalList}>
                {selectedList.map((d, idx) => {
                  const time = getTimeStringFromDynamic(d);
                  const text = truncateText(d?.text || "", 120);
                  const imgCount = Array.isArray(d?.images)
                    ? d.images.length
                    : 0;
                  const vidCount = Array.isArray(d?.videos)
                    ? d.videos.length
                    : 0;

                  return (
                    <div
                      key={`${d?.timestamp || idx}`}
                      className={styles.dateModalItem}
                    >
                      <div className={styles.dateModalItemHeader}>
                        <div className={styles.dateModalItemTime}>{time}</div>
                        <div className={styles.dateModalItemMedia}>
                          {imgCount > 0 && <span>🖼 {imgCount}</span>}
                          {vidCount > 0 && <span>🎞 {vidCount}</span>}
                        </div>
                      </div>
                      {text && (
                        <div className={styles.dateModalItemText}>{text}</div>
                      )}
                      {!text && (imgCount > 0 || vidCount > 0) && (
                        <div className={styles.dateModalItemTextMuted}>
                          这条记录用画面留住了当时。
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.dateModalEmpty}>
                这一天没有找到可展示的记录。
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Chapter7.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter7;
