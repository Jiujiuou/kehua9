import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import styles from "./YearCalendar.module.less";

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const pad2 = (n) => String(n).padStart(2, "0");

const getDateStringFromDynamic = (dynamic) => {
  if (dynamic?.date) return dynamic.date;
  if (!dynamic?.timestamp) return null;

  const d = new Date(dynamic.timestamp);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const getYearFromDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
};

/**
 * 年度日历组件：展示一年中哪些日期发布过动态（点亮）。
 * - 仅使用 props 传入数据，不依赖任何 mock 目录。
 * - year 不传则按 dynamics 中年份最多的那年（否则用当前年）。
 */
const YearCalendar = ({ dynamics = [], year }) => {
  const [animatedActiveDays, setAnimatedActiveDays] = useState(0);

  const resolvedYear = useMemo(() => {
    if (typeof year === "number" && !Number.isNaN(year)) return year;

    const yearCount = new Map();
    (Array.isArray(dynamics) ? dynamics : []).forEach((d) => {
      const dateStr = getDateStringFromDynamic(d);
      const y = getYearFromDateString(dateStr);
      if (!y) return;
      yearCount.set(y, (yearCount.get(y) || 0) + 1);
    });

    if (yearCount.size === 0) return new Date().getFullYear();

    let bestYear = null;
    let bestCount = -1;
    for (const [y, c] of yearCount.entries()) {
      if (c > bestCount) {
        bestYear = y;
        bestCount = c;
      }
    }

    return bestYear ?? new Date().getFullYear();
  }, [dynamics, year]);

  const monthsData = useMemo(() => {
    const activeDatesSet = new Set();

    (Array.isArray(dynamics) ? dynamics : []).forEach((dynamic) => {
      const dateStr = getDateStringFromDynamic(dynamic);
      if (!dateStr) return;
      const y = getYearFromDateString(dateStr);
      if (y !== resolvedYear) return;
      activeDatesSet.add(dateStr);
    });

    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];

    const months = [];
    let activeDayIndex = 0;

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(resolvedYear, month + 1, 0).getDate();

      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${resolvedYear}-${pad2(month + 1)}-${pad2(day)}`;
        const currentDate = new Date(resolvedYear, month, day);
        const dayOfWeek = currentDate.getDay();

        const hasActivity = activeDatesSet.has(dateStr);
        days.push({
          day,
          date: dateStr,
          hasActivity,
          dayOfWeek,
          activeDayIndex: hasActivity ? activeDayIndex : -1,
        });

        if (hasActivity) activeDayIndex++;
      }

      months.push({ name: monthNames[month], days });
    }

    return months;
  }, [dynamics, resolvedYear]);

  const totalActiveDays = useMemo(() => {
    return monthsData.reduce(
      (sum, month) => sum + month.days.filter((d) => d.hasActivity).length,
      0
    );
  }, [monthsData]);

  useEffect(() => {
    if (totalActiveDays === 0) return;

    setAnimatedActiveDays(0);

    const totalDuration = 8000;
    const delayPerActiveDay = totalDuration / totalActiveDays;

    let animationFrame;
    let startTime;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;

      const activeDaysToShow = Math.min(
        Math.floor(elapsed / delayPerActiveDay) + 1,
        totalActiveDays
      );

      setAnimatedActiveDays(activeDaysToShow);

      if (activeDaysToShow < totalActiveDays) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [totalActiveDays]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>{resolvedYear}</div>
        <div className={styles.headerSubTitle}>
          {totalActiveDays > 0
            ? `点亮了 ${totalActiveDays} 天`
            : "还没有点亮任何一天"}
        </div>
      </div>

      <div className={styles.yearCalendar}>
        {monthsData.map((monthData, index) => (
          <div key={index} className={styles.monthContainer}>
            <div className={styles.monthName}>{monthData.name}</div>
            <div className={styles.daysGrid}>
              {monthData.days.map((dayData, dayIndex) => {
                let showAsActive = false;

                if (dayData.hasActivity) {
                  showAsActive = dayData.activeDayIndex < animatedActiveDays;
                }

                return (
                  <div
                    key={dayIndex}
                    className={`${styles.day} ${
                      showAsActive ? styles.active : styles.inactive
                    }`}
                    title={
                      dayData.hasActivity
                        ? `${dayData.date}（${WEEKDAY_NAMES[dayData.dayOfWeek]}）`
                        : dayData.date
                    }
                    style={{ gridColumn: dayData.dayOfWeek + 1 }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

YearCalendar.propTypes = {
  dynamics: PropTypes.array,
  year: PropTypes.number,
};

export default YearCalendar;
