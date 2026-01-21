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

const calculateHourlyStats = (dynamics) => {
  const hourStats = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return hourStats;
  }

  dynamics.forEach((dynamic) => {
    let hour = null;

    if (dynamic?.time) {
      const parsed = parseInt(String(dynamic.time).split(":")[0], 10);
      if (!Number.isNaN(parsed)) hour = parsed;
    }

    if (hour === null && dynamic?.timestamp) {
      hour = new Date(dynamic.timestamp).getHours();
    }

    if (typeof hour === "number" && hour >= 0 && hour < 24) {
      hourStats[hour].count++;
    }
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
    let hour = null;

    if (dynamic?.time) {
      const parsed = parseInt(String(dynamic.time).split(":")[0], 10);
      if (!Number.isNaN(parsed)) hour = parsed;
    }

    if (hour === null && dynamic?.timestamp) {
      hour = new Date(dynamic.timestamp).getHours();
    }

    if (typeof hour === "number" && (hour >= 23 || hour < 5)) {
      lateNightCount++;
    }
  });

  return {
    count: lateNightCount,
    percentage: Number(((lateNightCount / dynamics.length) * 100).toFixed(1)),
  };
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

const generateTimeDistributionText = (mostActiveHour, lateNightStats) => {
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

  if (lateNightStats?.count > 0 && !(hour >= 23 || hour < 6)) {
    texts.push({
      type: "normal",
      text: `深夜时光（23:00-05:00），你有${lateNightStats.count}次记录，那些安静的夜晚，你都在这里`,
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

    const hourlyStats = calculateHourlyStats(filtered);
    const mostActiveHour = getMostActiveHour(filtered);
    const lateNightStats = calculateLateNightStats(filtered);
    const timeDistributionText = generateTimeDistributionText(
      mostActiveHour,
      lateNightStats
    );

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
