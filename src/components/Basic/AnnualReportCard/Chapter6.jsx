import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  filterDynamicsToAnnualReportRange,
  getDynamicType,
  getDateStringFromDynamic,
  parseDateStringToUTC,
} from "@/utils/annualReport";
import { ANNUAL_REPORT_END_DATE } from "@/constant/annualReport";
import styles from "./Chapter6.module.less";

// ========== 统计文案生成逻辑（内置于 Chapter6，不依赖 mock 目录） ==========

const calculateDynamicStats = (dynamics) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return { total: 0, textOnly: 0, imageOnly: 0, videoOnly: 0, mixed: 0 };
  }

  const stats = {
    total: dynamics.length,
    textOnly: 0,
    imageOnly: 0,
    videoOnly: 0,
    mixed: 0,
  };

  dynamics.forEach((dynamic) => {
    const type = getDynamicType(dynamic);
    if (type === "text") stats.textOnly++;
    else if (type === "image") stats.imageOnly++;
    else if (type === "video") stats.videoOnly++;
    else if (type === "mixed") stats.mixed++;
  });

  return stats;
};

const calculateContentStats = (dynamics) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return {
      totalTextLength: 0,
      totalImages: 0,
      totalVideos: 0,
      avgTextLength: 0,
      textDynamicsCount: 0,
    };
  }

  let totalTextLength = 0;
  let textDynamicsCount = 0;
  let totalImages = 0;
  let totalVideos = 0;

  dynamics.forEach((dynamic) => {
    const text = dynamic?.text;
    if (text && text.trim().length > 0) {
      totalTextLength += text.trim().length;
      textDynamicsCount++;
    }

    if (Array.isArray(dynamic?.images)) {
      totalImages += dynamic.images.length;
    }

    if (Array.isArray(dynamic?.videos)) {
      totalVideos += dynamic.videos.length;
    }
  });

  return {
    totalTextLength,
    totalImages,
    totalVideos,
    avgTextLength:
      textDynamicsCount > 0
        ? Math.round(totalTextLength / textDynamicsCount)
        : 0,
    textDynamicsCount,
  };
};

const getActiveDates = (dynamics) => {
  const dates = new Set();

  if (!Array.isArray(dynamics) || dynamics.length === 0) return dates;

  dynamics.forEach((dynamic) => {
    if (dynamic?.date) {
      dates.add(dynamic.date);
      return;
    }

    if (dynamic?.timestamp) {
      const d = new Date(dynamic.timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dates.add(`${year}-${month}-${day}`);
    }
  });

  return dates;
};

const calculateCompanionDays = (dynamics) => getActiveDates(dynamics).size;

const calculateAvgDynamicsPerDay = (dynamics) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) return 0;

  const activeDays = calculateCompanionDays(dynamics);
  if (activeDays === 0) return 0;

  return Number((dynamics.length / activeDays).toFixed(1));
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

/**
 * 生成2025年终章完整文案（整合动态数据+活跃天数数据）
 * @param {Object} stats - 统计数据
 * @returns {Array} 文案数组，每个元素包含 type 和 text
 */
const generateFinalChapter2025Complete = (stats = {}) => {
  const {
    total = 0,
    textOnly = 0,
    imageOnly = 0,
    videoOnly = 0,
    mixed = 0,
    totalTextLength = 0,
    totalImages = 0,
    totalVideos = 0,
    avgTextLength = 0,
    activeDays = 0,
    avgDynamicsPerDay = 0,
    maxLength = 0,
    longestStreak = 0,
    mostActiveDay = "",
    mostActiveDayPercentage = 0,
  } = stats;

  const texts = [];

  // 计算衍生数据
  const mediaCount = totalImages + totalVideos;
  const daysInYear = 365; // 2025年有365天
  const activeDayRatio =
    activeDays > 0 ? Math.round((activeDays / daysInYear) * 100) : 0;

  // 计数部分
  if (total > 0) {
    let countText = `在可话的2025年——也是最后一年——你留下了${total}个瞬间。`;
    const typeParts = [];
    if (textOnly > 0) {
      typeParts.push(`${textOnly}次只用文字`);
    }
    if (mediaCount > 0) {
      const mediaParts = [];
      if (totalImages > 0) mediaParts.push(`${totalImages}张照片`);
      if (totalVideos > 0) mediaParts.push(`${totalVideos}个视频`);
      if (mediaParts.length > 0) {
        typeParts.push(`${mediaCount}次附上了画面（${mediaParts.join("，")}）`);
      }
    }
    if (typeParts.length > 0) {
      countText += `其中${typeParts.join("，")}。`;
    }
    countText += "这是你与世界对话的方式，我们都记得。";

    texts.push({
      type: "normal",
      text: countText,
    });
  }

  // 文字部分
  if (totalTextLength > 0) {
    const avgLength = Math.round(avgTextLength);
    texts.push({
      type: "normal",
      text: `你写下的${totalTextLength.toLocaleString()}个字，会在时间中留下回响。平均每条${avgLength}字——刚好是一次完整的倾诉。`,
    });

    if (maxLength > 0) {
      texts.push({
        type: "normal",
        text: `你还写过${maxLength.toLocaleString()}字的长文，那是你最深的思考，没有一丝保留。`,
      });
    }
  }

  // 点亮的日子部分
  if (activeDays > 0) {
    texts.push({
      type: "normal",
      text: `这一年，你点亮了${activeDays}天——在365天中占了${activeDayRatio}%。`,
    });

    if (longestStreak >= 2) {
      texts.push({
        type: "normal",
        text: `最长连续记录${longestStreak}天，那段时间的你，一定很认真地生活着。`,
      });
    }

    if (mostActiveDay && mostActiveDayPercentage > 0) {
      texts.push({
        type: "normal",
        text: `你最常在${mostActiveDay}记录（${mostActiveDayPercentage}%），那是属于你的固定节奏。`,
      });
    }
  }

  // 时间统计
  if (activeDays > 0 && avgDynamicsPerDay > 0) {
    let frequencyText = "";
    if (avgDynamicsPerDay < 1) {
      const days = (1 / avgDynamicsPerDay).toFixed(1);
      frequencyText = `每${days}天`;
    } else {
      frequencyText = "每天";
    }
    texts.push({
      type: "normal",
      text: `平均${frequencyText}记录一次。生活如此细碎，而你一直认真捡拾。`,
    });
  }

  // 结尾
  texts.push({
    type: "normal",
    text: "2025年12月，所有数字停在这里。但重要的不是记录，而是你曾如此认真地生活过。",
  });

  return texts;
};

/**
 * Chapter 6：最后的刻度
 */
const Chapter6 = ({ reportData, dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");

  const SUBTITLE_TEXT = "数字本无意义，直到成为告别";

  const computedStatisticsText = useMemo(() => {
    // 兼容：优先使用外部传入的 reportData.statisticsText
    const fromReport = reportData?.statisticsText;
    if (Array.isArray(fromReport) && fromReport.length > 0) {
      return fromReport;
    }

    // 否则使用当前传入的 dynamics 自行计算
    // 先过滤出年度报告截止日期之前的所有数据
    const filteredAll = filterDynamicsToAnnualReportRange(dynamics);

    // 提取年份（从 ANNUAL_REPORT_END_DATE 中获取，默认为 2025）
    const year =
      parseInt(String(ANNUAL_REPORT_END_DATE).slice(0, 4), 10) ||
      new Date().getFullYear();

    // 再过滤出仅 2025 年的数据
    const filtered = filteredAll.filter((d) => {
      const ds = getDateStringFromDynamic(d);
      return ds && String(ds).startsWith(`${year}-`);
    });

    if (filtered.length === 0) return [];

    const dynamicStats = calculateDynamicStats(filtered);
    const contentStats = calculateContentStats(filtered);
    const avgDynamicsPerDay = calculateAvgDynamicsPerDay(filtered);
    const activeDays = calculateCompanionDays(filtered);

    // 计算最长文字
    const maxLength =
      filtered.length > 0
        ? Math.max(
            ...filtered.filter((d) => d?.text).map((d) => d.text.length),
            0,
          )
        : 0;

    // 计算活跃日期和最长连续记录
    const activeDates = Array.from(getActiveDates(filtered)).sort();
    const longestStreak = calculateLongestStreak(activeDates);
    const mostActiveWeekday = calculateMostActiveWeekday(filtered);

    // 准备统计数据
    const stats = {
      total: filtered.length,
      textOnly: dynamicStats.textOnly,
      imageOnly: dynamicStats.imageOnly,
      videoOnly: dynamicStats.videoOnly,
      mixed: dynamicStats.mixed,
      totalTextLength: contentStats.totalTextLength,
      totalImages: contentStats.totalImages,
      totalVideos: contentStats.totalVideos,
      avgTextLength: contentStats.avgTextLength,
      activeDays,
      avgDynamicsPerDay,
      maxLength,
      longestStreak,
      mostActiveDay: mostActiveWeekday.dayName,
      mostActiveDayPercentage: mostActiveWeekday.percentage,
    };

    return generateFinalChapter2025Complete(stats);
  }, [reportData, dynamics]);

  const textList = Array.isArray(computedStatisticsText)
    ? computedStatisticsText
    : [];

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
        // 文字显示完成后，等待一段时间再显示内容
        setTimeout(() => {
          setShowContent(true);
        }, 1000);
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
    <div className={styles.chapter6Content}>
      <div
        className={`${styles.chapter6Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        2025，最后的刻度
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter6Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          {displayedSubtitle}
          {displayedSubtitle.length < SUBTITLE_TEXT.length && (
            <span className={styles.cursor}>|</span>
          )}
        </div>
      )}

      {textList.length > 0 && (
        <div
          className={`${styles.chapter6TextSection} ${
            showContent ? styles.fadeIn : styles.hidden
          }`}
        >
          {textList.map((item, index) => (
            <div
              key={index}
              className={`${styles.chapter6TextItem} ${
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

Chapter6.propTypes = {
  reportData: PropTypes.shape({
    statisticsText: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string,
      }),
    ),
  }),
  dynamics: PropTypes.array,
};

export default Chapter6;
