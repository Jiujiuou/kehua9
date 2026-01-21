import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_END_DATE } from "@/constant";
import YearCalendar from "./YearCalendar";
import styles from "./Chapter7.module.less";

const pad2 = (n) => String(n).padStart(2, "0");

const toDateString = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const getDateStringFromDynamic = (dynamic) => {
  if (dynamic?.date) return dynamic.date;
  if (!dynamic?.timestamp) return null;

  const d = new Date(dynamic.timestamp);
  if (Number.isNaN(d.getTime())) return null;

  return toDateString(d);
};

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

const parseDateStringToUTC = (dateStr) => {
  const [y, m, d] = String(dateStr).split("-").map((x) => parseInt(x, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) return null;
  return Date.UTC(y, m - 1, d);
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
    percentage: total > 0 ? Number(((counts[maxIndex] / total) * 100).toFixed(1)) : 0,
  };
};

const generateCalendarText = ({ companionDays, longestStreak, mostActiveWeekday, year }) => {
  const texts = [];

  if (companionDays <= 0) {
    texts.push({ type: "main", text: "这一年，你还没有点亮任何一天" });
    texts.push({
      type: "normal",
      text: "但没关系，新的日子还在继续，下一次记录就从今天开始。",
    });
    return texts;
  }

  texts.push({ type: "main", text: `${year} 年，你点亮了 ${companionDays} 天` });

  if (longestStreak >= 2) {
    texts.push({
      type: "normal",
      text: `最长连续记录 ${longestStreak} 天，那段时间的你，一定很认真地生活着。`,
    });
  } else {
    texts.push({
      type: "normal",
      text: "有些日子被你悄悄收藏，有些日子轻轻略过，都是生活本来的样子。",
    });
  }

  if (mostActiveWeekday?.count > 0) {
    texts.push({
      type: "normal",
      text: `你最常在${mostActiveWeekday.dayName}记录（${mostActiveWeekday.percentage}%），那是属于你的固定节奏。`,
    });
  }

  return texts;
};

const Chapter7 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const { filteredDynamics, year, calendarText } = useMemo(() => {
    const filteredDynamics = filterDynamicsToAnnualReportRange(dynamics);

    const year = parseInt(String(ANNUAL_REPORT_END_DATE).slice(0, 4), 10) || new Date().getFullYear();

    const activeDates = calculateActiveDates(filteredDynamics);
    const companionDays = activeDates.length;
    const longestStreak = calculateLongestStreak(activeDates);
    const mostActiveWeekday = calculateMostActiveWeekday(filteredDynamics);

    const calendarText = generateCalendarText({
      companionDays,
      longestStreak,
      mostActiveWeekday,
      year,
    });

    return { filteredDynamics, year, calendarText };
  }, [dynamics]);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTitle(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowText(true), 1100);
    const timer4 = setTimeout(() => setShowCalendar(true), 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className={styles.chapter7Content}>
      <div
        className={`${styles.chapter7Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        点亮的日子
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter7Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          那些被你记录过的日期，会发光
        </div>
      )}

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

      <div
        className={`${styles.calendarSection} ${
          showCalendar ? styles.fadeIn : styles.hidden
        }`}
      >
        <YearCalendar dynamics={filteredDynamics} year={year} />
      </div>
    </div>
  );
};

Chapter7.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter7;
