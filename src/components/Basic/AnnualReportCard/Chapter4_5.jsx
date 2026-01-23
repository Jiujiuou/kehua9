import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_END_DATE } from "@/constant";
import styles from "./Chapter4_5.module.less";

// ========== 字数季节变化 & 相册里的温度（内置于 Chapter4_5，不依赖 mock 目录） ==========

const filterDynamicsToAnnualReportRange = (dynamics = []) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) return [];

  const endDate = new Date(`${ANNUAL_REPORT_END_DATE}T23:59:59`);

  return dynamics.filter((dynamic) => {
    const ts = dynamic?.timestamp;
    if (!ts) return false;
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return false;
    return date <= endDate;
  });
};

const getMonthFromDynamic = (dynamic) => {
  if (!dynamic) return null;

  if (dynamic?.date) {
    // YYYY-MM-DD
    const m = String(dynamic.date).split("-")[1];
    const month = parseInt(m, 10);
    if (!Number.isNaN(month) && month >= 1 && month <= 12) return month;
  }

  if (dynamic?.timestamp) {
    const date = new Date(dynamic.timestamp);
    if (!Number.isNaN(date.getTime())) return date.getMonth() + 1;
  }

  return null;
};

const getSeasonByMonth = (month) => {
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "autumn";
  return "winter"; // 12, 1, 2
};

const getSeasonName = (season) => {
  if (season === "spring") return "春天";
  if (season === "summer") return "夏天";
  if (season === "autumn") return "秋天";
  return "冬天";
};

const getSeasonWarmText = (season) => {
  switch (season) {
    case "spring":
      return "像刚化开的风，轻盈但真。";
    case "summer":
      return "热烈直接，情绪来得快也亮得久。";
    case "autumn":
      return "更厚重一些，像把生活慢慢写深。";
    case "winter":
      return "更内敛一些，把想说的都收进句子里。";
    default:
      return "每一段表达，都有它的温度。";
  }
};

const calculateMonthlyTextStats = (dynamics = []) => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalChars: 0,
    textCount: 0,
    avgChars: 0,
    season: getSeasonByMonth(i + 1),
  }));

  if (!Array.isArray(dynamics) || dynamics.length === 0) return months;

  dynamics.forEach((d) => {
    const text = typeof d?.text === "string" ? d.text.trim() : "";
    if (!text) return;

    const month = getMonthFromDynamic(d);
    if (!month) return;

    const idx = month - 1;
    months[idx].totalChars += text.length;
    months[idx].textCount += 1;
  });

  months.forEach((m) => {
    m.avgChars = m.textCount > 0 ? Math.round(m.totalChars / m.textCount) : 0;
  });

  return months;
};

const calculateSeasonAverages = (monthlyStats = []) => {
  const acc = {
    spring: { season: "spring", total: 0, count: 0 },
    summer: { season: "summer", total: 0, count: 0 },
    autumn: { season: "autumn", total: 0, count: 0 },
    winter: { season: "winter", total: 0, count: 0 },
  };

  monthlyStats.forEach((m) => {
    if (!m || !m.season) return;
    if (m.avgChars <= 0) return;

    acc[m.season].total += m.avgChars;
    acc[m.season].count += 1;
  });

  const list = Object.values(acc)
    .map((s) => ({
      ...s,
      avg: s.count > 0 ? Number((s.total / s.count).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  return list;
};

const getDynamicType = (dynamic) => {
  const hasText = !!(dynamic?.text && String(dynamic.text).trim().length > 0);
  const hasImages = Array.isArray(dynamic?.images) && dynamic.images.length > 0;
  const hasVideos = Array.isArray(dynamic?.videos) && dynamic.videos.length > 0;

  if ((hasText && hasImages) || (hasText && hasVideos) || (hasImages && hasVideos)) {
    return "mixed";
  }
  if (hasImages) return "image";
  if (hasVideos) return "video";
  if (hasText) return "text";
  return "text";
};

const calculateAlbumTemperature = (dynamics = []) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return {
      total: 0,
      textOnly: 0,
      imageOrMixed: 0,
      videoOrMixed: 0,
      mediaAny: 0,
      prefer: "text",
      mediaRatio: 0,
      textRatio: 0,
      imageRatioInMedia: 0,
      videoRatioInMedia: 0,
    };
  }

  const stats = {
    total: dynamics.length,
    textOnly: 0,
    imageOrMixed: 0,
    videoOrMixed: 0,
    mediaAny: 0,
  };

  dynamics.forEach((d) => {
    const type = getDynamicType(d);
    if (type === "text") stats.textOnly += 1;

    const hasImages = Array.isArray(d?.images) && d.images.length > 0;
    const hasVideos = Array.isArray(d?.videos) && d.videos.length > 0;

    if (hasImages || hasVideos) stats.mediaAny += 1;
    if (hasImages) stats.imageOrMixed += 1;
    if (hasVideos) stats.videoOrMixed += 1;
  });

  const mediaRatio = Number(((stats.mediaAny / stats.total) * 100).toFixed(1));
  const textRatio = Number(((stats.textOnly / stats.total) * 100).toFixed(1));

  const prefer = stats.mediaAny > stats.textOnly ? "media" : "text";

  const denom = stats.mediaAny || 1;
  const imageRatioInMedia = Number(((stats.imageOrMixed / denom) * 100).toFixed(1));
  const videoRatioInMedia = Number(((stats.videoOrMixed / denom) * 100).toFixed(1));

  return {
    ...stats,
    prefer,
    mediaRatio,
    textRatio,
    imageRatioInMedia,
    videoRatioInMedia,
  };
};

const generateChapterText = ({ monthlyStats, seasonAverages, albumStats }) => {
  const texts = [];

  const hasAnyText = Array.isArray(monthlyStats)
    ? monthlyStats.some((m) => (m?.avgChars || 0) > 0)
    : false;

  if (hasAnyText) {
    const peakMonth = monthlyStats
      .filter((m) => (m?.avgChars || 0) > 0)
      .reduce((max, m) => (m.avgChars > max.avgChars ? m : max), monthlyStats[0]);

    const topSeason = Array.isArray(seasonAverages) ? seasonAverages[0] : null;
    const seasonName = getSeasonName(topSeason?.season);

    texts.push({
      type: "main",
      text: "字数会说话：你的表达，在一年里起起落落。",
    });

    if (peakMonth?.month) {
      texts.push({
        type: "normal",
        text: `在${peakMonth.month}月，你写得最用力：平均每条约${peakMonth.avgChars}字。那段时间，你一定有很多想留下些什么。`,
      });
    }

    if (topSeason?.avg > 0) {
      texts.push({
        type: "normal",
        text: `如果把这一年分成四季，你的“表达强度”在${seasonName}最明显（均值${topSeason.avg}字）。${getSeasonWarmText(
          topSeason.season
        )}`,
      });
    }
  } else {
    texts.push({
      type: "main",
      text: "这一年，你更喜欢用轻一点的方式记录。",
    });
    texts.push({
      type: "normal",
      text: "有些心情不必写得很长，留下一句也足够珍贵。",
    });
  }

  if (albumStats?.total > 0) {
    const preferText =
      albumStats.prefer === "media"
        ? "你更习惯用画面留住记忆"
        : "你更习惯用文字把生活说清楚";

    texts.push({
      type: "main",
      text: "相册里的温度",
    });

    texts.push({
      type: "normal",
      text: `${preferText}：这一年里，含图片/视频的动态占比${albumStats.mediaRatio}%，纯文字占比${albumStats.textRatio}%。画面慢但久，文字轻但真。`,
    });

    if (albumStats.mediaAny > 0) {
      texts.push({
        type: "normal",
        text: `在你的“画面记录”里，图片占比${albumStats.imageRatioInMedia}%，视频占比${albumStats.videoRatioInMedia}%。你选择的载体，也在替你说话。`,
      });
    }
  }

  return texts;
};

const Chapter4_5 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showText, setShowText] = useState(false);

  const { monthlyStats, seasonAverages, albumStats, textList } = useMemo(() => {
    const filtered = filterDynamicsToAnnualReportRange(dynamics);

    const monthlyStats = calculateMonthlyTextStats(filtered);
    const seasonAverages = calculateSeasonAverages(monthlyStats);
    const albumStats = calculateAlbumTemperature(filtered);

    const textList = generateChapterText({ monthlyStats, seasonAverages, albumStats });

    return { monthlyStats, seasonAverages, albumStats, textList };
  }, [dynamics]);

  const maxAvgChars = useMemo(() => {
    const max = Math.max(...(monthlyStats || []).map((m) => m.avgChars || 0), 0);
    return max > 0 ? max : 1;
  }, [monthlyStats]);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTitle(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowCharts(true), 1100);
    const timer4 = setTimeout(() => setShowText(true), 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className={styles.chapterContent}>
      <div
        className={`${styles.title} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        表达的季节
      </div>

      {showTitle && (
        <div
          className={`${styles.subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          字数的起伏，和相册的温度
        </div>
      )}

      {showCharts && (
        <div
          className={`${styles.charts} ${showCharts ? styles.fadeIn : styles.hidden}`}
        >
          <div className={styles.sectionTitle}>字数的季节变化</div>
          <div className={styles.monthChart}>
            {(monthlyStats || []).map((m) => {
              const height = Math.max(6, Math.round((m.avgChars / maxAvgChars) * 100));
              return (
                <div key={m.month} className={styles.monthCol}>
                  <div className={styles.barWrap}>
                    <div
                      className={`${styles.bar} ${styles[`bar_${m.season}`]}`}
                      style={{ height: `${height}%` }}
                      title={`${m.month}月 平均${m.avgChars}字`}
                    />
                  </div>
                  <div className={styles.monthLabel}>{m.month}</div>
                </div>
              );
            })}
          </div>

          <div className={styles.legend}>
            <span className={`${styles.legendDot} ${styles.dot_spring}`} /> 春
            <span className={`${styles.legendDot} ${styles.dot_summer}`} /> 夏
            <span className={`${styles.legendDot} ${styles.dot_autumn}`} /> 秋
            <span className={`${styles.legendDot} ${styles.dot_winter}`} /> 冬
          </div>

          <div className={styles.sectionTitle}>相册里的温度</div>
          <div className={styles.albumCard}>
            <div className={styles.albumRow}>
              <div className={styles.albumLabel}>含画面（图片/视频）</div>
              <div className={styles.albumValue}>{albumStats.mediaRatio}%</div>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${albumStats.mediaRatio}%` }}
              />
            </div>

            <div className={styles.albumRow}>
              <div className={styles.albumLabel}>纯文字</div>
              <div className={styles.albumValue}>{albumStats.textRatio}%</div>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFillMuted}
                style={{ width: `${albumStats.textRatio}%` }}
              />
            </div>

            {albumStats.mediaAny > 0 && (
              <div className={styles.mediaSplit}>
                <div className={styles.mediaSplitItem}>
                  <div className={styles.mediaSplitTop}>
                    <span className={styles.mediaSplitName}>图片</span>
                    <span className={styles.mediaSplitPct}>
                      {albumStats.imageRatioInMedia}%
                    </span>
                  </div>
                  <div className={styles.progressTrackSmall}>
                    <div
                      className={styles.progressFillImage}
                      style={{ width: `${albumStats.imageRatioInMedia}%` }}
                    />
                  </div>
                </div>

                <div className={styles.mediaSplitItem}>
                  <div className={styles.mediaSplitTop}>
                    <span className={styles.mediaSplitName}>视频</span>
                    <span className={styles.mediaSplitPct}>
                      {albumStats.videoRatioInMedia}%
                    </span>
                  </div>
                  <div className={styles.progressTrackSmall}>
                    <div
                      className={styles.progressFillVideo}
                      style={{ width: `${albumStats.videoRatioInMedia}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(textList) && textList.length > 0 && (
        <div
          className={`${styles.textSection} ${
            showText ? styles.fadeIn : styles.hidden
          }`}
        >
          {textList.map((item, index) => (
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

Chapter4_5.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter4_5;
