import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Chapter1.module.less";
import {
  HOLIDAYS,
  HOLIDAY_NAMES,
  SEASON_NAMES,
  WEEK_DAY_NAMES,
  WEEK_DAY_PREFIXES,
  ANNUAL_REPORT_END_DATE,
} from "@/constant";

// 生成日期描述
const generateDateDescription = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const weekDay = date.getDay(); // 0-6, 0是周日

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  // 1. 检查是否是特殊节日
  const yearHolidays = HOLIDAYS[year] || [];
  const holiday = yearHolidays.find((h) => h.date === dateStr);

  if (holiday) {
    return HOLIDAY_NAMES[holiday.name] || `一个特别的${holiday.name}`;
  }

  // 2. 判断季节
  const getSeason = (month) => {
    if (month >= 3 && month <= 5) return "春";
    if (month >= 6 && month <= 8) return "夏";
    if (month >= 9 && month <= 11) return "秋";
    return "冬";
  };

  const season = getSeason(month);

  // 3. 判断时段（用于组合）
  const getTimePeriod = (hour) => {
    if (hour >= 0 && hour < 6) return "凌晨";
    if (hour >= 6 && hour < 9) return "清晨";
    if (hour >= 9 && hour < 12) return "上午";
    if (hour >= 12 && hour < 14) return "正午";
    if (hour >= 14 && hour < 18) return "午后";
    if (hour >= 18 && hour < 20) return "傍晚";
    return "夜晚";
  };

  // 判断时段（完整描述，用于单独使用）
  const getTimePeriodFull = (hour) => {
    if (hour >= 0 && hour < 6) return "万籁俱寂的凌晨";
    if (hour >= 6 && hour < 9) return "晨光微露的早上";
    if (hour >= 9 && hour < 12) return "日光充盈的上午";
    if (hour >= 12 && hour < 14) return "烟火气十足的正午";
    if (hour >= 14 && hour < 18) return "思绪漫游的午后";
    if (hour >= 18 && hour < 20) return "晚霞漫天的傍晚";
    return "灯火阑珊的夜晚";
  };

  const timePeriod = getTimePeriod(hour);
  const timePeriodFull = getTimePeriodFull(hour);

  // 4. 判断星期
  const weekDayName = WEEK_DAY_NAMES[weekDay] || "";
  const weekDayPrefix = WEEK_DAY_PREFIXES[weekDay] || "";

  // 5. 组合生成文案
  // 优先使用：星期 + 时段
  if (weekDayName && timePeriod) {
    // 特殊处理周五傍晚和周六上午
    if (weekDay === 5 && hour >= 18 && hour < 20) {
      return "周末在望的周五傍晚";
    }
    if (weekDay === 6 && hour >= 9 && hour < 12) {
      return "完全属于自己的周六上午";
    }
    return `${weekDayPrefix}${weekDayName}${timePeriod}`;
  }

  // 其次使用：季节 + 时段
  if (season && timePeriodFull) {
    return `${SEASON_NAMES[season][0]}${timePeriodFull}`;
  }

  // 默认返回
  return "记忆中闪闪发光的一天";
};

// 截断文本
const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// 将数字转换为中文
const numberToChinese = (num) => {
  const chineseNumbers = [
    "",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
  ];

  if (num <= 10) {
    return chineseNumbers[num];
  } else if (num < 20) {
    return `十${chineseNumbers[num - 10]}`;
  } else if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    if (ones === 0) {
      return `${chineseNumbers[tens]}十`;
    } else {
      return `${chineseNumbers[tens]}十${chineseNumbers[ones]}`;
    }
  } else {
    // 超过100年，直接返回数字（不太可能出现）
    return num.toString();
  }
};

// 将天数转换为年份描述
const formatDaysToYears = (days) => {
  if (days < 365) {
    return "不到一年";
  }

  const years = days / 365;
  const fullYears = Math.floor(years);
  const remainder = years - fullYears;

  if (remainder < 0.5) {
    return `${numberToChinese(fullYears)}年多`;
  } else {
    return `近${numberToChinese(fullYears + 1)}年`;
  }
};

// 格式化数量（乘以10后按整百取值）
const formatCount = (count) => {
  const multiplied = count * 10;
  const rounded = Math.floor(multiplied / 100) * 100;
  return `${rounded}+`;
};
// 为你亮起过 1000+ 次共鸣的微光。
// 生成描述性文案
const generateDescriptionText = (days, count) => {
  const formattedTime = formatDaysToYears(days);
  const formattedCount = formatCount(count);
  return `在${formattedTime}的时间里，你亮起过${formattedCount}次共鸣的微光，\n是否有某一次，曾轻轻触动过你？`;
};

const Chapter1 = ({ userNickname = "", dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [showDays, setShowDays] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [showFirstEmotionalText, setShowFirstEmotionalText] = useState(false);
  const [showFirstDynamic, setShowFirstDynamic] = useState(false);
  const [showLastEmotionalText, setShowLastEmotionalText] = useState(false);
  const [showLastDynamic, setShowLastDynamic] = useState(false);
  const [displayTotalDays, setDisplayTotalDays] = useState(0);
  const [displayTotalCount, setDisplayTotalCount] = useState(0);
  const [filteredDynamics, setFilteredDynamics] = useState([]);
  const [showDescription, setShowDescription] = useState(false);

  // 计数增长动画
  const animateNumber = (
    targetValue,
    setValue,
    duration = 1500,
    onComplete
  ) => {
    const startValue = 0;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // 使用缓动函数（ease-out）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * easeOut
      );

      setValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(targetValue);
        // 动画完成后调用回调
        if (onComplete) {
          onComplete();
        }
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    // 调试：打印接收到的 userNickname
    console.log("Chapter1 received userNickname:", userNickname);
    console.log("Chapter1 received dynamics:", dynamics);

    // 先过滤出年度报告截止日期（2025-12-31）之前的所有动态
    const cutoffDate = new Date(ANNUAL_REPORT_END_DATE);
    cutoffDate.setHours(23, 59, 59, 999); // 设置为当天的最后一刻

    const filtered = dynamics
      .filter((dynamic) => {
        if (!dynamic?.timestamp) return false;
        const dynamicDate = new Date(dynamic.timestamp);
        return dynamicDate <= cutoffDate;
      })
      // 按时间戳排序（从早到晚）
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateA - dateB;
      });

    setFilteredDynamics(filtered);

    // 计算统计数据
    let totalCount = 0;
    let totalDays = 0;

    if (filtered.length > 0) {
      // 总条数：统计过滤后的数组长度
      totalCount = filtered.length;

      // 总天数：计算最早动态与最晚动态的日期差
      // 最初日期是第一条动态的日期（已排序，所以是最早的）
      const firstDynamic = filtered[0];
      const firstDate = firstDynamic?.timestamp
        ? new Date(firstDynamic.timestamp)
        : null;

      // 最后日期是最后一条动态的日期（已排序，所以是最晚的）
      const lastDynamic = filtered[filtered.length - 1];
      const lastDate = lastDynamic?.timestamp
        ? new Date(lastDynamic.timestamp)
        : null;

      if (firstDate && lastDate) {
        // 公式：(最后日期 - 最初日期) / (1000 * 60 * 60 * 24) + 1，结果取整
        const diffTime = lastDate.getTime() - firstDate.getTime();
        totalDays = Math.max(
          1,
          Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
        );
      }
    }

    // 先显示"欢迎回来"
    const timer1 = setTimeout(() => {
      setShowTitle(true);
    }, 300);

    // 然后显示昵称
    const timer2 = setTimeout(() => {
      setShowNickname(true);
    }, 1000);

    // 先显示日期（左侧）
    const timer3 = setTimeout(() => {
      setShowDays(true);
      // 开始日期计数增长动画，动画完成后显示数量
      animateNumber(totalDays, setDisplayTotalDays, 1500, () => {
        // 日期动画完成后，显示数量（右侧）
        setTimeout(() => {
          setShowCount(true);
          animateNumber(totalCount, setDisplayTotalCount, 1500, () => {
            // 数量动画完成后，显示描述性文案
            setTimeout(() => {
              setShowDescription(true);
            }, 500);
            // 然后显示第一条情感文案
            setTimeout(() => {
              setShowFirstEmotionalText(true);
              // 第一条情感文案显示后，显示第一条动态卡片
              setTimeout(() => {
                setShowFirstDynamic(true);
                // 第一条动态卡片显示后，显示第二条情感文案
                setTimeout(() => {
                  setShowLastEmotionalText(true);
                  // 第二条情感文案显示后，显示最后一条动态卡片
                  setTimeout(() => {
                    setShowLastDynamic(true);
                  }, 800);
                }, 800);
              }, 800);
            }, 500);
          });
        }, 200);
      });
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [userNickname, dynamics]);

  return (
    <div className={styles.chapter1Content}>
      <div className={styles.chapter1Title}>
        <span className={showTitle ? styles.fadeIn : styles.hidden}>
          欢迎回来，
        </span>
        {showTitle && (
          <span className={showNickname ? styles.fadeIn : styles.hidden}>
            {userNickname || "朋友"}。
          </span>
        )}
      </div>

      <div className={styles.statsContainer}>
        {showDays && (
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{displayTotalDays}</span>
            <span className={styles.statLabel}>天彼此陪伴</span>
          </div>
        )}
        {showCount && (
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{displayTotalCount}</span>
            <span className={styles.statLabel}>条用心记录</span>
          </div>
        )}
      </div>

      {showDescription && displayTotalDays > 0 && displayTotalCount > 0 && (
        <div className={`${styles.descriptionText} ${styles.fadeIn}`}>
          {generateDescriptionText(displayTotalDays, displayTotalCount)}
        </div>
      )}

      {filteredDynamics && filteredDynamics.length > 0 && (
        <div className={styles.dynamicsContainer}>
          {showFirstEmotionalText && (
            <div
              className={`${styles.emotionalText} ${styles.emotionalTextAbove} ${styles.fadeIn}`}
            >
              一切，从这里开始。
            </div>
          )}
          {showFirstDynamic && filteredDynamics[0] && (
            <div className={`${styles.dynamicItem} ${styles.fadeIn}`}>
              <div className={styles.dynamicHeader}>
                <span className={styles.dynamicDate}>
                  {filteredDynamics[0].date} {filteredDynamics[0].time}
                </span>
                <span className={styles.currentTimeDescription}>
                  {generateDateDescription(filteredDynamics[0].timestamp)}
                </span>
              </div>
              {filteredDynamics[0].text && (
                <div className={styles.dynamicText}>
                  {truncateText(filteredDynamics[0].text, 50)}
                </div>
              )}
            </div>
          )}
          {showLastEmotionalText && (
            <div
              className={`${styles.emotionalText} ${styles.emotionalTextAbove} ${styles.fadeIn}`}
            >
              旅程，在此刻暂歇。
            </div>
          )}
          {showLastDynamic &&
            (() => {
              // 获取过滤后的最后一条动态
              const lastDynamic = filteredDynamics[filteredDynamics.length - 1];

              if (!lastDynamic) return null;

              return (
                <div className={`${styles.dynamicItem} ${styles.fadeIn}`}>
                  <div className={styles.dynamicHeader}>
                    <span className={styles.dynamicDate}>
                      {lastDynamic.date} {lastDynamic.time}
                    </span>
                    <span className={styles.currentTimeDescription}>
                      {generateDateDescription(lastDynamic.timestamp)}
                    </span>
                  </div>
                  {lastDynamic.text && (
                    <div className={styles.dynamicText}>
                      {truncateText(lastDynamic.text, 50)}
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
};

Chapter1.propTypes = {
  userNickname: PropTypes.string,
  dynamics: PropTypes.array,
};

export default Chapter1;
