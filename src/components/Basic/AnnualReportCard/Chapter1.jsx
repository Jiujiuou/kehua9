import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Chapter1.module.less";
import { ANNUAL_REPORT_END_DATE } from "@/constant";
import { filterDynamicsToAnnualReportRange } from "@/utils/annualReport";
import DynamicCard from "@/components/Basic/DynamicCard";

// 格式化日期时间显示
const formatDateTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 为 DynamicCard 准备动态数据（需要 date 和 time 字段）
const prepareDynamicForCard = (dynamic) => {
  if (!dynamic) return null;
  // 如果动态已经有 date 和 time 字段，直接返回
  if (dynamic.date && dynamic.time) {
    return dynamic;
  }
  // 否则从 timestamp 生成
  return {
    ...dynamic,
    date: formatDateTime(dynamic.timestamp).split(" ")[0],
    time: formatDateTime(dynamic.timestamp).split(" ")[1] || "",
  };
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

const Chapter1 = ({ userNickname = "", dynamics = [], onPreviewClick }) => {
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

  // 延迟辅助函数
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 计数增长动画（返回 Promise）
  const animateNumber = (targetValue, setValue, duration = 1500) => {
    return new Promise((resolve) => {
      const startValue = 0;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);

        // 使用缓动函数（ease-out）
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(
          startValue + (targetValue - startValue) * easeOut,
        );

        setValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setValue(targetValue);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  };

  useEffect(() => {
    // 先过滤出年度报告截止日期（2025-12-31）之前的所有动态，并按时间戳排序（从早到晚）
    const cutoffDate = new Date(ANNUAL_REPORT_END_DATE);
    cutoffDate.setHours(23, 59, 59, 999); // 设置为当天的最后一刻

    const filtered = filterDynamicsToAnnualReportRange(dynamics, {
      sort: true,
    });

    setFilteredDynamics(filtered);

    // 计算统计数据
    let totalCount = 0;
    let totalDays = 0;

    if (filtered.length > 0) {
      // 总条数：统计过滤后的数组长度
      totalCount = filtered.length;

      // 总天数：计算最早动态到年度报告截止日期（2025-12-31）的日期差
      // 最初日期是第一条动态的日期（已排序，所以是最早的）
      const firstDynamic = filtered[0];
      const firstDate = firstDynamic?.timestamp
        ? new Date(firstDynamic.timestamp)
        : null;

      // 结束日期固定为年度报告截止日（上面已设置为当天最后一刻）
      const endDate = cutoffDate;

      if (firstDate && endDate) {
        // 公式：(截止日期 - 最初日期) / (1000 * 60 * 60 * 24) + 1，结果取整
        const diffTime = endDate.getTime() - firstDate.getTime();
        totalDays = Math.max(
          1,
          Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1,
        );
      }
    }

    // 动画序列执行函数
    const runAnimationSequence = async () => {
      // 先显示"欢迎回来"
      await delay(300);
      setShowTitle(true);

      // 然后显示昵称
      await delay(700); // 1000 - 300 = 700
      setShowNickname(true);

      // 先显示日期（左侧）
      await delay(800); // 1800 - 1000 = 800
      setShowDays(true);

      // 开始日期计数增长动画
      await animateNumber(totalDays, setDisplayTotalDays, 1500);

      // 日期动画完成后，显示数量（右侧）
      await delay(200);
      setShowCount(true);

      // 数量计数增长动画
      await animateNumber(totalCount, setDisplayTotalCount, 1500);

      // 数量动画完成后，显示描述性文案
      await delay(800);
      setShowDescription(true);

      // 描述性文案展示完毕后，等一会儿再展示第一条情感文案
      await delay(2500);
      setShowFirstEmotionalText(true);

      // 第一条情感文案显示后，等一会儿再展示第一条动态卡片
      await delay(2000);
      setShowFirstDynamic(true);

      // 第一条动态卡片显示后，等一会儿再展示第二条情感文案
      await delay(2000);
      setShowLastEmotionalText(true);

      // 第二条情感文案显示后，等一会儿再展示最后一条动态卡片
      await delay(2000);
      setShowLastDynamic(true);
    };

    runAnimationSequence();

    return () => {
      // 清理函数（如果需要取消动画，可以在这里添加逻辑）
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
            <div className={styles.fadeIn}>
              <DynamicCard
                dynamic={prepareDynamicForCard(filteredDynamics[0])}
                index={0}
                contentGap={12}
                borderRadius={8}
                imageGap={4}
                fontSize={15}
                fontWeight={400}
                fontFamily="system"
                lineHeight={1.6}
                textIndent={true}
                paragraphSpacing={false}
                showPreviewButton={false}
                showDeleteButton={false}
                allowContentClickToPreview={true}
                onPreviewClick={onPreviewClick}
              />
            </div>
          )}
          {showLastEmotionalText && (
            <div
              className={`${styles.emotionalText} ${styles.emotionalTextAbove} ${styles.fadeIn}`}
              style={{ marginTop: 20 }}
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
                <div className={`${styles.fadeIn} ${styles.lastDynamic}`}>
                  <DynamicCard
                    dynamic={prepareDynamicForCard(lastDynamic)}
                    index={filteredDynamics.length - 1}
                    contentGap={12}
                    borderRadius={8}
                    imageGap={4}
                    fontSize={15}
                    fontWeight={400}
                    fontFamily="system"
                    lineHeight={1.6}
                    textIndent={true}
                    paragraphSpacing={false}
                    showPreviewButton={false}
                    showDeleteButton={false}
                    allowContentClickToPreview={true}
                    onPreviewClick={onPreviewClick}
                  />
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
  onPreviewClick: PropTypes.func,
};

export default Chapter1;
