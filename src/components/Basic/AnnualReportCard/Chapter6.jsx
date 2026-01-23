import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_END_DATE } from "@/constant";
import HourlyActivityRiver from "./HourlyActivityRiver";
import styles from "./Chapter6.module.less";

// ========== 时间分布计算与文案生成（内置于 Chapter6，不依赖 mock 目录） ==========

const filterDynamicsToAnnualReportRange = (dynamics = []) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) return [];
  const endDate = new Date(`${ANNUAL_REPORT_END_DATE}T23:59:59`);

  return dynamics.filter((dynamic) => {
    const ts = dynamic?.timestamp;
    if (!ts) return false;
    const date = new Date(ts);
    return date <= endDate;
  });
};

const getHourFromDynamic = (dynamic) => {
  let hour = null;

  if (dynamic?.time) {
    const parsed = parseInt(String(dynamic.time).split(":")[0], 10);
    if (!Number.isNaN(parsed)) hour = parsed;
  }

  if (hour === null && dynamic?.timestamp) {
    const date = new Date(dynamic.timestamp);
    if (!Number.isNaN(date.getTime())) hour = date.getHours();
  }

  return typeof hour === "number" && hour >= 0 && hour < 24 ? hour : null;
};

const calculateHourlyStats = (dynamics) => {
  const hourStats = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return hourStats;
  }

  dynamics.forEach((dynamic) => {
    const hour = getHourFromDynamic(dynamic);
    if (hour !== null) hourStats[hour].count++;
  });

  return hourStats;
};

const getMostActiveHour = (dynamics) => {
  const hourlyStats = calculateHourlyStats(dynamics);
  const maxStat = hourlyStats.reduce(
    (max, stat) => (stat.count > max.count ? stat : max),
    hourlyStats[0]
  );

  return {
    hour: maxStat.hour,
    count: maxStat.count,
    percentage:
      Array.isArray(dynamics) && dynamics.length > 0
        ? Number(((maxStat.count / dynamics.length) * 100).toFixed(1))
        : 0,
  };
};

const calculateLateNightStats = (dynamics) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return { count: 0, percentage: 0 };
  }

  let lateNightCount = 0;

  dynamics.forEach((dynamic) => {
    const hour = getHourFromDynamic(dynamic);
    if (hour === null) return;
    if (hour >= 23 || hour < 5) lateNightCount++;
  });

  return {
    count: lateNightCount,
    percentage: Number(((lateNightCount / dynamics.length) * 100).toFixed(1)),
  };
};

const getPeriodByHour = (hour) => {
  // 这些区间更贴近“作息画像”的直觉划分
  if (hour >= 0 && hour < 6)
    return { key: "dawn", name: "凌晨", range: "00:00-05:59" };
  if (hour >= 6 && hour < 9)
    return { key: "earlyMorning", name: "清晨", range: "06:00-08:59" };
  if (hour >= 9 && hour < 12)
    return { key: "morning", name: "上午", range: "09:00-11:59" };
  if (hour >= 12 && hour < 14)
    return { key: "noon", name: "午间", range: "12:00-13:59" };
  if (hour >= 14 && hour < 18)
    return { key: "afternoon", name: "午后", range: "14:00-17:59" };
  if (hour >= 18 && hour < 20)
    return { key: "dusk", name: "傍晚", range: "18:00-19:59" };
  if (hour >= 20 && hour < 23)
    return { key: "night", name: "夜晚", range: "20:00-22:59" };
  return { key: "lateNight", name: "深夜", range: "23:00-23:59" };
};

const calculatePeriodStats = (dynamics) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) return [];

  const map = new Map();

  dynamics.forEach((dynamic) => {
    const hour = getHourFromDynamic(dynamic);
    if (hour === null) return;

    const period = getPeriodByHour(hour);
    const prev = map.get(period.key);

    map.set(period.key, {
      ...period,
      count: (prev?.count || 0) + 1,
    });
  });

  const total = dynamics.length || 1;

  return Array.from(map.values())
    .map((p) => ({
      ...p,
      percentage: Number(((p.count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
};

const getTimePeriodDescription = (hour) => {
  if (hour >= 1 && hour < 6) return "深夜时分，当世界安静下来";
  if (hour >= 6 && hour < 9) return "清晨醒来，新的一天开始";
  if (hour >= 9 && hour < 12) return "上午时光，忙碌中抽空";
  if (hour >= 12 && hour < 14) return "午间休息，片刻的宁静";
  if (hour >= 14 && hour < 18) return "午后时光";
  if (hour >= 18 && hour < 20) return "傍晚时分，一天的疲惫渐渐散去";
  if (hour >= 20 && hour < 23) return "夜晚来临";
  return "夜深了";
};

const getPeriodWarmText = (period) => {
  switch (period?.key) {
    case "dawn":
      return "凌晨的你，像把一天的心事轻轻放进文字里。";
    case "earlyMorning":
      return "清晨的你，把生活重新点亮，给自己一个温柔的开始。";
    case "morning":
      return "上午的你，在忙碌的节奏里也不忘留下些什么。";
    case "noon":
      return "午间的你，懂得停下来喘口气，把自己照顾好。";
    case "afternoon":
      return "午后的你，把琐碎也写得有光，像给生活加了一点糖。";
    case "dusk":
      return "傍晚的你，一边收尾，一边把今天好好告别。";
    case "night":
      return "夜晚的你，更愿意把思绪整理成句子，慢慢与自己对话。";
    case "lateNight":
      return "深夜的你，把安静留给自己，也把真实写下来。";
    default:
      return "你在时间里留下些什么，也在慢慢认识自己。";
  }
};

const generateTimePersonaText = (periodStats = []) => {
  if (!Array.isArray(periodStats) || periodStats.length === 0) return [];

  const [dominant, ...rest] = periodStats;
  const texts = [];

  if (dominant?.count > 0) {
    texts.push({
      type: "normal",
      text: `从整体来看，你更像“${dominant.name}的你”。在${dominant.range}这段时间，你的记录占比最高（${dominant.percentage}%）。${getPeriodWarmText(
        dominant
      )}`,
    });
  }

  const others = rest.filter((p) => p?.count > 0).slice(0, 2);
  others.forEach((p) => {
    texts.push({
      type: "normal",
      text: `“${p.name}的你”（${p.range}）占比${p.percentage}%。${getPeriodWarmText(p)}`,
    });
  });

  return texts;
};

const generateTimeDistributionText = (mostActiveHour, lateNightStats, dominantPeriod) => {
  const texts = [];

  const hour = mostActiveHour?.hour ?? 0;
  const nextHour = hour + 1;
  const hourText = `${hour}:00-${nextHour}:00`;
  const timePeriod = getTimePeriodDescription(hour);

  let mainText = "";
  if (hour >= 1 && hour < 6) {
    mainText = `你最爱凌晨发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里记录着那些白天来不及说的话`;
  } else if (hour >= 6 && hour < 9) {
    mainText = `你最爱清晨发布动态。${hourText}是你最活跃的时候，${timePeriod}，你习惯在这里开始新的一天`;
  } else if (hour >= 9 && hour < 12) {
    mainText = `你最爱上午发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里记录着忙碌中的片刻`;
  } else if (hour >= 12 && hour < 14) {
    mainText = `你最爱午间发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里享受着片刻的宁静`;
  } else if (hour >= 14 && hour < 18) {
    mainText = `你最爱下午发布动态。${hourText}是你最活跃的时候，手边的咖啡蓄满了忙碌，但此刻你学会在这里放个空`;
  } else if (hour >= 18 && hour < 20) {
    mainText = `你最爱傍晚发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里记录着一天的结束`;
  } else if (hour >= 20 && hour < 23) {
    mainText = `你最爱晚上发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里整理着一天的思绪`;
  } else {
    mainText = `你最爱深夜发布动态。${hourText}是你最活跃的时候，${timePeriod}，你还在记录着`;
  }

  texts.push({ type: "main", text: mainText });

  const dominantKey = dominantPeriod?.key;
  const dominantIsLate = dominantKey === "dawn" || dominantKey === "lateNight";

  if (lateNightStats?.count > 0 && !(hour >= 23 || hour < 6) && !dominantIsLate) {
    texts.push({
      type: "normal",
      text: `深夜时光（23:00-05:00），你有${lateNightStats.count}次记录，那些安静的夜晚，你也常常在这里`,
    });
  }

  return texts;
};

const Chapter6 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showRiver, setShowRiver] = useState(false);
  const [showText, setShowText] = useState(false);

  const { hourlyStats, mostActiveHour, timeDistributionText } = useMemo(() => {
    const filtered = filterDynamicsToAnnualReportRange(dynamics);

    if (!Array.isArray(filtered) || filtered.length === 0) {
      return { hourlyStats: [], mostActiveHour: null, timeDistributionText: [] };
    }

    const hourlyStats = calculateHourlyStats(filtered);
    const mostActiveHour = getMostActiveHour(filtered);
    const lateNightStats = calculateLateNightStats(filtered);

    const periodStats = calculatePeriodStats(filtered);
    const dominantPeriod = periodStats?.[0];

    const timeDistributionText = [
      ...generateTimeDistributionText(mostActiveHour, lateNightStats, dominantPeriod),
      ...generateTimePersonaText(periodStats),
    ];

    return { hourlyStats, mostActiveHour, timeDistributionText };
  }, [dynamics]);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTitle(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowRiver(true), 1100);
    const timer4 = setTimeout(() => setShowText(true), 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className={styles.chapter6Content}>
      <div
        className={`${styles.chapter6Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        时光流转
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter6Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          记录你一天中的活跃轨迹
        </div>
      )}

      <div
        className={`${styles.riverSection} ${
          showRiver ? styles.fadeIn : styles.hidden
        }`}
      >
        <HourlyActivityRiver
          hourlyStats={hourlyStats}
          mostActiveHour={mostActiveHour}
        />
      </div>

      {Array.isArray(timeDistributionText) && timeDistributionText.length > 0 && (
        <div
          className={`${styles.textSection} ${
            showText ? styles.fadeIn : styles.hidden
          }`}
        >
          {timeDistributionText.map((item, index) => (
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
    </div>
  );
};

Chapter6.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter6;
