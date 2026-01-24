import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  filterDynamicsToAnnualReportRange,
  getDynamicType,
  getDateStringFromDynamic,
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

const generateStatisticsText = (
  dynamicStats,
  contentStats,
  totalDynamics,
  avgDynamicsPerDay,
  dynamics = []
) => {
  const texts = [];

  // 总动态数描述
  if (totalDynamics >= 100) {
    texts.push({
      type: "main",
      text: `这一年，你在这里留下了${totalDynamics}个瞬间，见证了每一刻的珍贵`,
    });
  } else {
    texts.push({
      type: "main",
      text: `这一年，你在这里留下了${totalDynamics}个瞬间`,
    });
  }

  // 动态类型描述
  const typeDescriptions = [];
  if (dynamicStats.textOnly > 0) {
    typeDescriptions.push(`${dynamicStats.textOnly}条是纯文字`);
  }
  if (dynamicStats.mixed > 0) {
    typeDescriptions.push(`${dynamicStats.mixed}条图文并茂`);
  }
  if (dynamicStats.imageOnly > 0) {
    typeDescriptions.push(`${dynamicStats.imageOnly}条是图片`);
  }
  if (dynamicStats.videoOnly > 0) {
    typeDescriptions.push(`${dynamicStats.videoOnly}条是视频`);
  }

  if (typeDescriptions.length > 0) {
    texts.push({
      type: "normal",
      text: `其中${typeDescriptions.join("，")}`,
    });
  }

  // 文字量描述
  if (contentStats.totalTextLength > 0) {
    const avgLength = Math.round(contentStats.avgTextLength);
    const hasLongText = dynamics.some((d) => d?.text && d.text.length > 500);

    if (hasLongText) {
      const maxLength = Math.max(
        ...dynamics.filter((d) => d?.text).map((d) => d.text.length)
      );
      texts.push({
        type: "normal",
        text: `你写下了${contentStats.totalTextLength.toLocaleString()}个字，平均每条${avgLength}字。你写下过${maxLength}字的长文，那是最深的思考`,
      });
    } else {
      texts.push({
        type: "normal",
        text: `你写下了${contentStats.totalTextLength.toLocaleString()}个字，平均每条${avgLength}字，就像在写一本属于自己的书`,
      });
    }
  }

  // 图片描述
  if (contentStats.totalImages > 0) {
    if (contentStats.totalImages >= 50) {
      texts.push({
        type: "normal",
        text: `你用镜头记录了${contentStats.totalImages}个瞬间，定格了那些美好的时光`,
      });
    } else {
      texts.push({
        type: "normal",
        text: `你用镜头记录了${contentStats.totalImages}个瞬间，每一张都珍贵`,
      });
    }
  }

  // 视频描述
  if (contentStats.totalVideos > 0) {
    if (contentStats.totalVideos >= 10) {
      texts.push({
        type: "normal",
        text: `${contentStats.totalVideos}个视频，记录了流动的时光`,
      });
    }
  }

  // 平均记录描述
  if (avgDynamicsPerDay && avgDynamicsPerDay > 0) {
    const avgRounded =
      typeof avgDynamicsPerDay === "number"
        ? avgDynamicsPerDay.toFixed(1)
        : avgDynamicsPerDay;

    texts.push({
      type: "normal",
      text: `平均每天${avgRounded}次记录，生活的点滴都被你细心收藏`,
    });
  }

  return texts;
};

/**
 * Chapter 6：数字背后
 */
const Chapter6 = ({ reportData, dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showContent, setShowContent] = useState(false);

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

    return generateStatisticsText(
      dynamicStats,
      contentStats,
      filtered.length,
      avgDynamicsPerDay,
      filtered
    );
  }, [reportData, dynamics]);

  const textList = Array.isArray(computedStatisticsText)
    ? computedStatisticsText
    : [];

  useEffect(() => {
    console.log("[Chapter6] 组件初始化");

    const timer1 = setTimeout(() => {
      setShowTitle(true);
    }, 300);

    const timer2 = setTimeout(() => {
      setShowSubtitle(true);
    }, 800);

    const timer3 = setTimeout(() => {
      setShowContent(true);
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className={styles.chapter6Content}>
      <div
        className={`${styles.chapter6Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        数字背后
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter6Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          每一个数字，都是真实的你
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
    </div>
  );
};

Chapter6.propTypes = {
  reportData: PropTypes.shape({
    statisticsText: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string,
      })
    ),
  }),
  dynamics: PropTypes.array,
};

export default Chapter6;
