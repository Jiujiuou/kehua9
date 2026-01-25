import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { filterDynamicsToAnnualReportRange } from "@/utils/annualReport";
import HourlyActivityRiver from "./HourlyActivityRiver";
import styles from "./Chapter5.module.less";

// ========== 时间分布计算与文案生成（内置于 Chapter5，不依赖 mock 目录） ==========

const getHourFromDynamic = (dynamic) => {
  let hour = null;

  if (dynamic?.time) {
    const parsed = parseInt(String(dynamic.time).split(":")[0], 10);
    if (!Number.isNaN(parsed)) hour = parsed;
  }

  if (hour === null && dynamic?.timestamp) {
    const date = new Date(dynamic.timestamp);
    if (!Number.isNaN(date.getTime())) hour = date.getHours();
  }

  return typeof hour === "number" && hour >= 0 && hour < 24 ? hour : null;
};

const calculateHourlyStats = (dynamics) => {
  const hourStats = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
  }));

  if (!Array.isArray(dynamics) || dynamics.length === 0) {
    return hourStats;
  }

  dynamics.forEach((dynamic) => {
    const hour = getHourFromDynamic(dynamic);
    if (hour !== null) hourStats[hour].count++;
  });

  return hourStats;
};

const getMostActiveHour = (dynamics) => {
  const hourlyStats = calculateHourlyStats(dynamics);
  const maxStat = hourlyStats.reduce(
    (max, stat) => (stat.count > max.count ? stat : max),
    hourlyStats[0],
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
    const hour = getHourFromDynamic(dynamic);
    if (hour === null) return;
    if (hour >= 23 || hour < 5) lateNightCount++;
  });

  return {
    count: lateNightCount,
    percentage: Number(((lateNightCount / dynamics.length) * 100).toFixed(1)),
  };
};

const getPeriodByHour = (hour) => {
  // 这些区间更贴近"作息画像"的直觉划分
  if (hour >= 0 && hour < 6)
    return { key: "dawn", name: "凌晨", range: "00:00-05:59" };
  if (hour >= 6 && hour < 9)
    return { key: "earlyMorning", name: "清晨", range: "06:00-08:59" };
  if (hour >= 9 && hour < 12)
    return { key: "morning", name: "上午", range: "09:00-11:59" };
  if (hour >= 12 && hour < 14)
    return { key: "noon", name: "午间", range: "12:00-13:59" };
  if (hour >= 14 && hour < 18)
    return { key: "afternoon", name: "午后", range: "14:00-17:59" };
  if (hour >= 18 && hour < 20)
    return { key: "dusk", name: "傍晚", range: "18:00-19:59" };
  if (hour >= 20 && hour < 23)
    return { key: "night", name: "夜晚", range: "20:00-22:59" };
  return { key: "lateNight", name: "深夜", range: "23:00-23:59" };
};

const calculatePeriodStats = (dynamics) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) return [];

  const map = new Map();

  dynamics.forEach((dynamic) => {
    const hour = getHourFromDynamic(dynamic);
    if (hour === null) return;

    const period = getPeriodByHour(hour);
    const prev = map.get(period.key);

    map.set(period.key, {
      ...period,
      count: (prev?.count || 0) + 1,
    });
  });

  const total = dynamics.length || 1;

  return Array.from(map.values())
    .map((p) => ({
      ...p,
      percentage: Number(((p.count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
};

const getTimePeriodDescription = (hour) => {
  if (hour >= 1 && hour < 6) return "世界沉睡，你独自清醒";
  if (hour >= 6 && hour < 9) return "晨光微亮，一天刚刚开始";
  if (hour >= 9 && hour < 12) return "忙碌的上午，间隙中的片刻";
  if (hour >= 12 && hour < 14) return "午后的安静时光";
  if (hour >= 14 && hour < 18) return "下午的漫长与温柔";
  if (hour >= 18 && hour < 20) return "傍晚，白天的尾声";
  if (hour >= 20 && hour < 23) return "夜晚，思绪开始流淌";
  return "一天将尽，与自己对话";
};

const getPeriodWarmText = (period) => {
  switch (period?.key) {
    case "dawn":
      return "在无人打扰的凌晨，你把心事轻轻放下。";
    case "earlyMorning":
      return "清晨的你，给自己一个温柔的起点。";
    case "morning":
      return "上午的你，在忙碌中也不忘捕捉瞬间。";
    case "noon":
      return "午间的你，懂得停下来的艺术。";
    case "afternoon":
      return "午后的你，给琐碎日常加上一点光。";
    case "dusk":
      return "傍晚的你，一边告别今天，一边开始整理。";
    case "night":
      return "夜晚的你，更适合与自己深度对话。";
    case "lateNight":
      return "深夜的你，把真实留给了文字。";
    default:
      return "时间流过，你在不同时刻留下不同模样的自己。";
  }
};

const generateTimePersonaText = (periodStats = []) => {
  if (!Array.isArray(periodStats) || periodStats.length === 0) return [];

  const sortedPeriods = periodStats.filter((p) => p?.count > 0);
  const texts = [];

  const first = sortedPeriods[0];
  const second = sortedPeriods[1];

  if (first) {
    texts.push({
      type: "normal",
      text: `你更接近"${first.name}的你"——在${first.range}记录最多。${getPeriodWarmText(first)}`,
    });
  }

  // 如果有显著的第二高峰，才提
  if (second && second.percentage > 15) {
    texts.push({
      type: "normal",
      text: `而${second.name}（${second.range}）也是你的另一个活跃窗口。`,
    });
  }

  // 如果数据分布特别均匀
  const isEven = sortedPeriods.filter((p) => p.percentage > 10).length >= 4;
  if (isEven) {
    texts.push({
      type: "normal",
      text: "你的记录时间很分散，似乎每个时刻都有想说的话。",
    });
  }

  return texts;
};

const generateTimeDistributionText = (
  mostActiveHour,
  lateNightStats,
  dominantPeriod,
) => {
  const texts = [];

  if (!mostActiveHour) return texts;

  const hour = mostActiveHour.hour;
  const hourText = `${hour}:00-${hour + 1}:00`;
  const periodDesc = getTimePeriodDescription(hour);
  const period = getPeriodByHour(hour);
  const periodName = period.name;

  // 更简洁的主文案
  const mainText = `一天中，你最爱在${periodName}记录生活——${hourText}是你的高峰时刻。${periodDesc}`;
  texts.push({ type: "main", text: mainText });

  // 深夜数据补充
  const dominantKey = dominantPeriod?.key;
  const dominantIsLate = dominantKey === "dawn" || dominantKey === "lateNight";

  if (
    lateNightStats?.percentage > 10 &&
    !(hour >= 23 || hour < 6) &&
    !dominantIsLate
  ) {
    texts.push({
      type: "normal",
      text: `此外，深夜（23:00-05:00）也有${lateNightStats.percentage}%的记录。那些安静的时刻，你也在书写。`,
    });
  }

  return texts;
};

const Chapter5 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showRiver, setShowRiver] = useState(false);
  const [showText, setShowText] = useState(false);
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");

  const SUBTITLE_TEXT = "你的一天，在时间里慢慢成形";

  const { hourlyStats, mostActiveHour, timeDistributionText } = useMemo(() => {
    const filtered = filterDynamicsToAnnualReportRange(dynamics);

    if (!Array.isArray(filtered) || filtered.length === 0) {
      return {
        hourlyStats: [],
        mostActiveHour: null,
        timeDistributionText: [],
      };
    }

    const hourlyStats = calculateHourlyStats(filtered);
    const mostActiveHour = getMostActiveHour(filtered);
    const lateNightStats = calculateLateNightStats(filtered);

    const periodStats = calculatePeriodStats(filtered);
    const dominantPeriod = periodStats?.[0];

    const timeDistributionText = [
      ...generateTimeDistributionText(
        mostActiveHour,
        lateNightStats,
        dominantPeriod,
      ),
      ...generateTimePersonaText(periodStats),
    ];

    return { hourlyStats, mostActiveHour, timeDistributionText };
  }, [dynamics]);

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
        // 文字显示完成后，等待一段时间再显示图表
        setTimeout(() => {
          setShowRiver(true);
          // 图表显示后，再等待一段时间显示文案
          setTimeout(() => {
            setShowText(true);
          }, 1500);
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
    <div className={styles.chapter5Content}>
      <div
        className={`${styles.chapter5Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        时间的形状
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter5Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          {displayedSubtitle}
          {displayedSubtitle.length < SUBTITLE_TEXT.length && (
            <span className={styles.cursor}>|</span>
          )}
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

      {Array.isArray(timeDistributionText) &&
        timeDistributionText.length > 0 && (
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
      {/* 底部间距，确保内容不被裁剪 */}
      <div style={{ height: "32px", width: "100%", flexShrink: 0 }} />
    </div>
  );
};

Chapter5.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter5;
