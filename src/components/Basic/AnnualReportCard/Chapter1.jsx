import { useState, useEffect, useRef } from "react";
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

const Chapter1 = ({ userNickname = "", dynamics = [] }) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [showDays, setShowDays] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [showFirstEmotionalText, setShowFirstEmotionalText] = useState(false);
  const [showFirstDynamic, setShowFirstDynamic] = useState(false);
  const [showLastEmotionalText, setShowLastEmotionalText] = useState(false);
  const [showLastDynamic, setShowLastDynamic] = useState(false);
  const [slideUp, setSlideUp] = useState(false);
  const [displayTotalCount, setDisplayTotalCount] = useState(0);
  const [displayTotalDays, setDisplayTotalDays] = useState(0);
  const welcomeTextRef = useRef(null);
  const welcomeContentRef = useRef(null);
  const firstEmotionalTextRef = useRef(null);
  const firstDynamicRef = useRef(null);
  const lastEmotionalTextRef = useRef(null);
  const lastDynamicRef = useRef(null);
  const statsContainerRef = useRef(null);
  const slideDistanceRef = useRef(0);

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
    console.log("WelcomePage received userNickname:", userNickname);
    console.log("WelcomePage received dynamics:", dynamics);

    // 计算统计数据
    let totalCount = 0;
    let totalDays = 0;

    if (dynamics && dynamics.length > 0) {
      // 总条数：直接统计数组长度
      totalCount = dynamics.length;

      // 总天数：计算第一条动态与最后一条动态的日期差
      // 最后日期是年度报告截止日期
      const lastDate = new Date(ANNUAL_REPORT_END_DATE);

      // 最初日期是第一条动态的日期
      const firstDynamic = dynamics[0];
      const firstDate = firstDynamic?.timestamp
        ? new Date(firstDynamic.timestamp)
        : null;

      if (firstDate) {
        // 公式：(最后日期 - 最初日期) / (1000 * 60 * 60 * 24) + 1，结果取整
        const diffTime = lastDate.getTime() - firstDate.getTime();
        totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    // 先显示"欢迎回来"
    const timer1 = setTimeout(() => {
      setShowWelcome(true);
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
            // 数量动画完成后，先显示第一条情感文案
            setTimeout(() => {
              // 计算需要滑动的距离：欢迎标语高度 + gap
              if (welcomeTextRef.current && welcomeContentRef.current) {
                const welcomeTextHeight = welcomeTextRef.current.offsetHeight;
                const gap = 48; // 与 CSS 中的 gap 保持一致
                const initialSlideDistance = welcomeTextHeight + gap;
                slideDistanceRef.current = initialSlideDistance;
                welcomeContentRef.current.style.setProperty(
                  "--slide-distance",
                  `-${initialSlideDistance}px`
                );
                setSlideUp(true);
              }
              // 显示第一条情感文案
              setShowFirstEmotionalText(true);
              // 第一条情感文案显示后，显示第一条动态卡片
              setTimeout(() => {
                setShowFirstDynamic(true);
                // 第一条动态卡片显示后，继续向上推动并显示第二条情感文案
                setTimeout(() => {
                  if (
                    firstEmotionalTextRef.current &&
                    firstDynamicRef.current &&
                    welcomeContentRef.current
                  ) {
                    const emotionalTextHeight =
                      firstEmotionalTextRef.current.offsetHeight;
                    const dynamicHeight = firstDynamicRef.current.offsetHeight;
                    const gap = 24; // 动态容器之间的 gap
                    const additionalSlide =
                      emotionalTextHeight + dynamicHeight + gap;
                    const newSlideDistance =
                      slideDistanceRef.current + additionalSlide;
                    slideDistanceRef.current = newSlideDistance;
                    welcomeContentRef.current.style.setProperty(
                      "--slide-distance",
                      `-${newSlideDistance}px`
                    );
                  }
                  // 显示第二条情感文案
                  setShowLastEmotionalText(true);
                  // 第二条情感文案显示后，显示最后一条动态卡片
                  setTimeout(() => {
                    setShowLastDynamic(true);
                    // 最后一条动态卡片显示后，计算最终滑动距离
                    setTimeout(() => {
                      if (welcomeContentRef.current && lastDynamicRef.current) {
                        // 使用 getBoundingClientRect 获取更准确的位置信息
                        const contentRect =
                          welcomeContentRef.current.getBoundingClientRect();
                        const lastDynamicRect =
                          lastDynamicRef.current.getBoundingClientRect();

                        // 获取父容器的高度（可视区域高度）
                        const containerHeight =
                          welcomeContentRef.current.parentElement
                            ?.offsetHeight || window.innerHeight;

                        // 计算最后一条卡片底部相对于内容区域顶部的位置
                        const lastDynamicBottom =
                          lastDynamicRect.bottom - contentRect.top;

                        // 计算滑动距离：让最后一条卡片底部刚好在容器底部
                        // 需要考虑容器的 padding (32px)
                        const padding = 64;
                        const finalSlideDistance = Math.max(
                          0,
                          lastDynamicBottom - containerHeight + padding
                        );

                        welcomeContentRef.current.style.setProperty(
                          "--slide-distance",
                          `-${finalSlideDistance}px`
                        );
                      }
                    }, 500);
                  }, 800);
                }, 800);
              }, 800);
            }, 500);
          });
        }, 200); // 稍微延迟一下，让过渡更自然
      });
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [userNickname, dynamics]);

  return (
    <div
      ref={welcomeContentRef}
      className={`${styles.welcomeContent} ${
        slideUp ? styles.slideUpContent : ""
      }`}
    >
      <div ref={welcomeTextRef} className={styles.welcomeText}>
        <span className={showWelcome ? styles.fadeIn : styles.hidden}>
          欢迎回来，
        </span>
        {showWelcome && (
          <span className={showNickname ? styles.fadeIn : styles.hidden}>
            {userNickname || "朋友"}。
          </span>
        )}
      </div>

      <div ref={statsContainerRef} className={styles.statsContainer}>
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

      {dynamics && dynamics.length > 0 && (
        <div className={styles.dynamicsContainer}>
          {showFirstEmotionalText && (
            <div
              ref={firstEmotionalTextRef}
              className={`${styles.emotionalText} ${styles.emotionalTextAbove} ${styles.fadeIn}`}
            >
              一切，从这里开始。
            </div>
          )}
          {showFirstDynamic && dynamics[0] && (
            <div
              ref={firstDynamicRef}
              className={`${styles.dynamicItem} ${styles.fadeIn}`}
            >
              <div className={styles.dynamicHeader}>
                <span className={styles.dynamicDate}>
                  {dynamics[0].date} {dynamics[0].time}
                </span>
                <span className={styles.currentTimeDescription}>
                  {generateDateDescription(dynamics[0].timestamp)}
                </span>
              </div>
              {dynamics[0].text && (
                <div className={styles.dynamicText}>
                  {truncateText(dynamics[0].text, 50)}
                </div>
              )}
            </div>
          )}
          {showLastEmotionalText && (
            <div
              ref={lastEmotionalTextRef}
              className={`${styles.emotionalText} ${styles.emotionalTextAbove} ${styles.fadeIn}`}
            >
              旅程，在此刻暂歇。
            </div>
          )}
          {showLastDynamic &&
            (() => {
              // 找到年度报告截止日期之前最后一条动态
              const cutoffDate = new Date(ANNUAL_REPORT_END_DATE);
              const lastDynamicBeforeCutoff = dynamics
                .filter((dynamic) => {
                  if (!dynamic?.timestamp) return false;
                  const dynamicDate = new Date(dynamic.timestamp);
                  return dynamicDate < cutoffDate;
                })
                .pop(); // 获取最后一条

              if (!lastDynamicBeforeCutoff) return null;

              return (
                <div
                  ref={lastDynamicRef}
                  className={`${styles.dynamicItem} ${styles.fadeIn}`}
                >
                  <div className={styles.dynamicHeader}>
                    <span className={styles.dynamicDate}>
                      {lastDynamicBeforeCutoff.date}{" "}
                      {lastDynamicBeforeCutoff.time}
                    </span>
                    <span className={styles.currentTimeDescription}>
                      {generateDateDescription(
                        lastDynamicBeforeCutoff.timestamp
                      )}
                    </span>
                  </div>
                  {lastDynamicBeforeCutoff.text && (
                    <div className={styles.dynamicText}>
                      {truncateText(lastDynamicBeforeCutoff.text, 50)}
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
