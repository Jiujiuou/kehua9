import { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./YearCalendar.module.less";

/**
 * 年度日历组件 - 显示一年中哪些日期发布过动态
 * 只显示两种状态：有动态（点亮）和无动态（置灰）
 * 带有从1月到12月、从1号到31号的逐个点亮动画
 */
const YearCalendar = ({ dynamics, year }) => {
  const [animatedActiveDays, setAnimatedActiveDays] = useState(0); // 已经动画过的点亮天数

  const monthsData = useMemo(() => {
    if (!dynamics) return [];

    // 创建一个 Set 存储所有有动态的日期
    const activeDatesSet = new Set();
    dynamics.forEach((dynamic) => {
      activeDatesSet.add(dynamic.date); // YYYY-MM-DD
    });

    // 确定年份
    const targetYear = year || new Date().getFullYear();

    // 生成12个月的数据
    const months = [];
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

    let dayIndex = 0; // 全局天数索引
    let activeDayIndex = 0; // 点亮天数索引

    for (let month = 0; month < 12; month++) {
      const monthData = {
        name: monthNames[month],
        days: [],
      };

      // 获取该月的天数
      const daysInMonth = new Date(targetYear, month + 1, 0).getDate();

      // 生成该月的每一天
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${targetYear}-${String(month + 1).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}`;
        const currentDate = new Date(targetYear, month, day);
        const dayOfWeek = currentDate.getDay(); // 0=周日, 1=周一, ..., 6=周六

        // 检查这天是否有动态
        const hasActivity = activeDatesSet.has(dateStr);

        monthData.days.push({
          day,
          date: dateStr,
          hasActivity,
          dayOfWeek,
          dayIndex, // 用于显示所有天
          activeDayIndex: hasActivity ? activeDayIndex : -1, // 只有点亮的天才有索引
        });

        dayIndex++;
        if (hasActivity) {
          activeDayIndex++;
        }
      }

      months.push(monthData);
    }

    return months;
  }, [dynamics, year]);

  // 计算点亮的总天数
  const totalActiveDays = useMemo(() => {
    return monthsData.reduce(
      (sum, month) => sum + month.days.filter((d) => d.hasActivity).length,
      0
    );
  }, [monthsData]);

  // 启动点亮动画
  useEffect(() => {
    if (totalActiveDays === 0) return;

    // 重置动画
    setAnimatedActiveDays(0);

    // 计算动画总时长（10秒）和每个点亮天的延迟
    const totalDuration = 8000; // 10秒
    const delayPerActiveDay = totalDuration / totalActiveDays;

    // 使用 requestAnimationFrame 实现更流畅的动画
    let animationFrame;
    let startTime;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;

      // 计算应该点亮多少天
      const activeDaysToShow = Math.min(
        Math.floor(elapsed / delayPerActiveDay) + 1,
        totalActiveDays
      );

      setAnimatedActiveDays(activeDaysToShow);

      // 如果还没完成，继续动画
      if (activeDaysToShow < totalActiveDays) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [totalActiveDays]);

  return (
    <div className={styles.yearCalendar}>
      {monthsData.map((monthData, index) => (
        <div key={index} className={styles.monthContainer}>
          <div className={styles.monthName}>{monthData.name}</div>
          <div className={styles.daysGrid}>
            {monthData.days.map((dayData, dayIndex) => {
              // 所有天都显示，但只有点亮的天才有动画
              let showAsActive = false;

              if (dayData.hasActivity) {
                // 如果这一天有活动，检查是否应该点亮
                showAsActive = dayData.activeDayIndex < animatedActiveDays;
              }

              return (
                <div
                  key={dayIndex}
                  className={`${styles.day} ${
                    showAsActive ? styles.active : styles.inactive
                  }`}
                  style={{ gridColumn: dayData.dayOfWeek + 1 }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

YearCalendar.propTypes = {
  dynamics: PropTypes.array,
  year: PropTypes.number,
};

export default YearCalendar;
