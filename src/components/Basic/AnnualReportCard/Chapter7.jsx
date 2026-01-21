import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_END_DATE } from "@/constant";
import YearCalendar from "./YearCalendar";
import styles from "./Chapter7.module.less";

const pad2 = (n) => String(n).padStart(2, "0");

const toDateString = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const getDateStringFromDynamic = (dynamic) => {
  if (dynamic?.date) return dynamic.date;
  if (!dynamic?.timestamp) return null;

  const d = new Date(dynamic.timestamp);
  if (Number.isNaN(d.getTime())) return null;

  return toDateString(d);
};

const getTimeStringFromDynamic = (dynamic) => {
  if (dynamic?.time) return String(dynamic.time);
  if (!dynamic?.timestamp) return "";
  const d = new Date(dynamic.timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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

const formatMonthDay = (dateStr, { alwaysShowYear = false } = {}) => {
  if (!dateStr) return "—";
  const [y, m, d] = String(dateStr).split("-").map((x) => parseInt(x, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) return "—";

  if (alwaysShowYear) return `${y}年${m}月${d}日`;
  return `${m}月${d}日`;
};

const truncateText = (text, maxLen = 80) => {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}...`;
};

const getFirstSentence = (text) => {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (!t) return "";
  const parts = t.split(/[。！？.!?\n]/).map((s) => s.trim());
  const first = parts.find((s) => s.length > 0);
  return first || truncateText(t, 50);
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

const buildDateToDynamicsMap = (dynamics) => {
  const map = new Map();

  (Array.isArray(dynamics) ? dynamics : []).forEach((d) => {
    const dateStr = getDateStringFromDynamic(d);
    if (!dateStr) return;

    if (!map.has(dateStr)) map.set(dateStr, []);
    map.get(dateStr).push(d);
  });

  // 保证每天内部按时间排序
  for (const list of map.values()) {
    list.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));
  }

  return map;
};

const findSilenceMoment = ({ activeDatesAll, reportYear }) => {
  // 选取“重新开始日期在 reportYear 内”的最长间隔
  if (!Array.isArray(activeDatesAll) || activeDatesAll.length < 2) {
    return { silenceDays: 0, lastDateStr: null, restartDateStr: null };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const isInYear = (dateStr) => String(dateStr).startsWith(`${reportYear}-`);

  let best = { silenceDays: 0, lastDateStr: null, restartDateStr: null };

  for (let i = 1; i < activeDatesAll.length; i++) {
    const prevStr = activeDatesAll[i - 1];
    const curStr = activeDatesAll[i];

    if (!isInYear(curStr)) continue;

    const prevUTC = parseDateStringToUTC(prevStr);
    const curUTC = parseDateStringToUTC(curStr);
    if (prevUTC === null || curUTC === null) continue;

    const diffDays = Math.round((curUTC - prevUTC) / dayMs);
    if (diffDays > best.silenceDays) {
      best = { silenceDays: diffDays, lastDateStr: prevStr, restartDateStr: curStr };
    }
  }

  return best;
};

const buildSilenceTexts = ({ silenceDays, lastDateStr, restartDateStr, year, restartDayTextInfo }) => {
  const texts = [];

  // 兜底：没有足够数据形成静默
  if (!lastDateStr || !restartDateStr || silenceDays <= 0) {
    texts.push({
      type: "main",
      text: "这一年，你的记录几乎没有长时间的停歇。",
    });
    texts.push({
      type: "normal",
      text: "你的自我对话很稳定——这份持续的温柔，本身就很了不起。",
    });
    return texts;
  }

  const showYear = !String(lastDateStr).startsWith(`${year}-`);
  const lastText = formatMonthDay(lastDateStr, { alwaysShowYear: showYear });
  const restartText = formatMonthDay(restartDateStr, { alwaysShowYear: false });

  // 分层叙事
  if (silenceDays >= 1 && silenceDays <= 7) {
    texts.push({ type: "main", text: `你有 ${silenceDays} 天 没有打开日记。` });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 到 ${restartText}，生活可能像往常一样继续，\n只是你选择暂时不记录。`,
    });
    texts.push({
      type: "normal",
      text: "有时候，不表达也是一种表达。短暂的停歇让下一次记录更加真实。",
    });
    texts.push({
      type: "normal",
      text: "就像呼吸需要呼气后的那个停顿——停下，是为了更深的吸气。",
    });
  } else if (silenceDays >= 8 && silenceDays <= 30) {
    texts.push({ type: "main", text: `${silenceDays} 天——这是你今年最长的记录间隔。` });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 的最后一条记录，\n到 ${restartText} 的重新开始，\n将近一个月的时间里，日记本在安静等待。`,
    });
    texts.push({
      type: "normal",
      text: "也许那段日子，你正在经历某种内在的转变；\n也许日常的忙碌让你无暇内观；\n也许情绪太过复杂，难以言说。",
    });
    texts.push({
      type: "normal",
      text: `但重要的是，你在 ${restartText} 回来了。`,
    });
    texts.push({
      type: "normal",
      text: "空窗期不是空白期，而是内心的酝酿。就像土壤需要休耕，心灵也需要静默。",
    });
  } else if (silenceDays >= 31 && silenceDays <= 90) {
    texts.push({ type: "main", text: `${silenceDays} 天的静默。` });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 的告别，\n到 ${restartText} 的重启。`,
    });
    texts.push({
      type: "normal",
      text: "这段时间里，你可能经历了重要的变化，\n可能专注于现实的挑战，\n或者只是需要时间消化内心的波澜。",
    });
    texts.push({
      type: "normal",
      text: "这不是简单的回归，而是带着新的感悟归来。",
    });
    texts.push({
      type: "normal",
      text: "最长的停顿，往往带来最深的领悟。停下不是结束，而是蓄力。",
    });
  } else {
    texts.push({ type: "main", text: `${silenceDays} 天的旅程，在日记本外发生。` });
    texts.push({
      type: "normal",
      text: `从 ${lastText} 到 ${restartText}，你度过了整整一个季节的静默。`,
    });
    texts.push({
      type: "normal",
      text: "这段时间里，你可能经历了一场漫长的内心跋涉；\n沉浸在生活的另一个维度；\n学会了用行动而非文字表达；\n需要完全的沉淀才能重新出发。",
    });
    texts.push({
      type: "normal",
      text: `在 ${restartText} 你写下的第一行字，\n不只是记录的继续，更是与过去自己的对话。`,
    });
    texts.push({
      type: "normal",
      text: "如此长的静默，足以让旧的自己落叶，新的自己破土。",
    });
  }

  // 特殊时段洞察（轻量版）
  const lastMonth = parseInt(String(lastDateStr).split("-")[1], 10);
  const restartMonth = parseInt(String(restartDateStr).split("-")[1], 10);
  const lastYear = parseInt(String(lastDateStr).split("-")[0], 10);
  const restartYear = parseInt(String(restartDateStr).split("-")[0], 10);

  if (lastYear !== restartYear && lastMonth === 12 && restartMonth === 1) {
    texts.push({
      type: "normal",
      text: "你的静默跨越了旧年与新年。\n从岁末的沉淀到新年的更新，\n你在时间的交界处完成了一次内在的更替。",
    });
  } else if (lastMonth >= 6 && lastMonth <= 8 && restartMonth >= 6 && restartMonth <= 8) {
    texts.push({
      type: "normal",
      text: "夏季的静默更像外向的生活。\n文字可以等待，但阳光与汗水不会。",
    });
  } else if (restartMonth >= 9 && restartMonth <= 11) {
    texts.push({
      type: "normal",
      text: "在秋天重新开始是一种智慧。\n把经历慢慢转化成文字，让成长有迹可循。",
    });
  }

  // 重新开始那天的内容洞察（只做轻量正向提示）
  if (restartDayTextInfo) {
    const { totalTextLength = 0, hasRestartKeywords = false } = restartDayTextInfo;

    if (totalTextLength > 0 && totalTextLength < 50) {
      texts.push({
        type: "normal",
        text: "重新开始的那天，你写得很简短。\n像是试探性的第一步，小心翼翼却又坚定地回归自我对话。",
      });
    } else if (totalTextLength > 200) {
      texts.push({
        type: "normal",
        text: "重新开始的那天，你写下了长长的文字。\n有些话，酝酿越久，表达越深。",
      });
    }

    if (hasRestartKeywords) {
      texts.push({
        type: "normal",
        text: "你在那天写下了“重新/再/继续”。\n这次暂停，对你来说是一场有意识的重新出发。",
      });
    }
  }

  texts.push({
    type: "normal",
    text: "给未来的自己：如果还会有这样的静默期，不必自责，不必着急。相信按下暂停键的你，也相信总会重新开始的你。",
  });

  return texts;
};

const Chapter7 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSilence, setShowSilence] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const {
    year,
    yearDynamics,
    calendarText,
    silenceMoment,
    silenceTexts,
    dateToDynamics,
    restartHighlight,
  } = useMemo(() => {
    const filteredAll = filterDynamicsToAnnualReportRange(dynamics);

    const year =
      parseInt(String(ANNUAL_REPORT_END_DATE).slice(0, 4), 10) ||
      new Date().getFullYear();

    const yearDynamics = filteredAll.filter((d) => {
      const ds = getDateStringFromDynamic(d);
      return ds && String(ds).startsWith(`${year}-`);
    });

    const activeDatesInYear = calculateActiveDates(yearDynamics);
    const companionDays = activeDatesInYear.length;
    const longestStreak = calculateLongestStreak(activeDatesInYear);
    const mostActiveWeekday = calculateMostActiveWeekday(yearDynamics);

    const calendarText = generateCalendarText({
      companionDays,
      longestStreak,
      mostActiveWeekday,
      year,
    });

    const dateToDynamics = buildDateToDynamicsMap(filteredAll);
    const activeDatesAll = Array.from(dateToDynamics.keys()).sort();

    const silenceMoment = findSilenceMoment({
      activeDatesAll,
      reportYear: year,
    });

    const restartList = silenceMoment.restartDateStr
      ? dateToDynamics.get(silenceMoment.restartDateStr) || []
      : [];

    const restartFirst = restartList[0] || null;
    const restartFirstSentence = restartFirst?.text
      ? getFirstSentence(restartFirst.text)
      : "";

    const restartTotalTextLength = restartList.reduce((sum, d) => {
      const t = d?.text;
      return sum + (t && typeof t === "string" ? t.trim().length : 0);
    }, 0);

    const hasRestartKeywords = restartList.some((d) => {
      const t = d?.text;
      if (!t || typeof t !== "string") return false;
      return t.includes("重新") || t.includes("再") || t.includes("继续");
    });

    const restartDayTextInfo = {
      totalTextLength: restartTotalTextLength,
      hasRestartKeywords,
    };

    const silenceTexts = buildSilenceTexts({
      silenceDays: silenceMoment.silenceDays,
      lastDateStr: silenceMoment.lastDateStr,
      restartDateStr: silenceMoment.restartDateStr,
      year,
      restartDayTextInfo,
    });

    const restartHighlight = {
      dateStr: silenceMoment.restartDateStr,
      firstSentence: restartFirstSentence,
      totalTextLength: restartTotalTextLength,
      imagesCount: restartList.reduce(
        (sum, d) => sum + (Array.isArray(d?.images) ? d.images.length : 0),
        0
      ),
      videosCount: restartList.reduce(
        (sum, d) => sum + (Array.isArray(d?.videos) ? d.videos.length : 0),
        0
      ),
    };

    return {
      year,
      yearDynamics,
      calendarText,
      silenceMoment,
      silenceTexts,
      dateToDynamics,
      restartHighlight,
    };
  }, [dynamics]);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTitle(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowText(true), 1100);
    const timer4 = setTimeout(() => setShowCalendar(true), 1300);
    const timer5 = setTimeout(() => setShowSilence(true), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  const openDateModal = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setShowDateModal(true);
  };

  const selectedList = useMemo(() => {
    if (!selectedDate) return [];
    return dateToDynamics.get(selectedDate) || [];
  }, [dateToDynamics, selectedDate]);

  const showYearInTimeline = useMemo(() => {
    const last = silenceMoment?.lastDateStr;
    const restart = silenceMoment?.restartDateStr;
    if (!last || !restart) return false;

    const lastYear = parseInt(String(last).slice(0, 4), 10);
    const restartYear = parseInt(String(restart).slice(0, 4), 10);
    return lastYear !== restartYear;
  }, [silenceMoment]);

  return (
    <div className={styles.chapter7Content}>
      <div
        className={`${styles.chapter7Title} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        点亮的日子
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter7Subtitle} ${showSubtitle ? styles.fadeIn : styles.hidden}`}
        >
          那些被你记录过的日期，会发光
        </div>
      )}

      {Array.isArray(calendarText) && calendarText.length > 0 && (
        <div className={`${styles.textSection} ${showText ? styles.fadeIn : styles.hidden}`}>
          {calendarText.map((item, index) => (
            <div
              key={index}
              className={`${styles.textItem} ${item?.type === "main" ? styles.mainText : styles.normalText}`}
            >
              {item?.text}
            </div>
          ))}
        </div>
      )}

      <div className={`${styles.calendarSection} ${showCalendar ? styles.fadeIn : styles.hidden}`}>
        <YearCalendar dynamics={yearDynamics} year={year} />
      </div>

      {/* 你的静默时刻 */}
      <div className={`${styles.silenceSection} ${showSilence ? styles.fadeIn : styles.hidden}`}>
        <div className={styles.silenceHeader}>
          <div className={styles.silenceTitle}>你的静默时刻</div>
          <div className={styles.silenceSubtitle}>停下不是结束，而是蓄力</div>
        </div>

        {silenceMoment?.lastDateStr && silenceMoment?.restartDateStr ? (
          <div className={styles.timeline}>
            <button
              type="button"
              className={styles.timelineDateButton}
              onClick={() => openDateModal(silenceMoment.lastDateStr)}
              title="查看当天记录"
            >
              <div className={styles.timelineDateText}>
                {formatMonthDay(silenceMoment.lastDateStr, { alwaysShowYear: showYearInTimeline })}
              </div>
              <div className={styles.timelineIcon}>⭐</div>
            </button>

            <div className={styles.timelineLine} aria-hidden="true" />

            <div className={styles.silenceDaysBubble}>
              <div className={styles.silenceDaysValue}>{silenceMoment.silenceDays}</div>
              <div className={styles.silenceDaysLabel}>天的静默</div>
            </div>

            <div className={styles.timelineLine} aria-hidden="true" />

            <button
              type="button"
              className={styles.timelineDateButton}
              onClick={() => openDateModal(silenceMoment.restartDateStr)}
              title="查看当天记录"
            >
              <div className={styles.timelineDateText}>
                {formatMonthDay(silenceMoment.restartDateStr, { alwaysShowYear: false })}
              </div>
              <div className={styles.timelineIcon}>✨</div>
            </button>
          </div>
        ) : (
          <div className={styles.timelineEmpty}>
            这一年，你的记录节奏很平稳，几乎没有明显的长静默。
          </div>
        )}

        {Array.isArray(silenceTexts) && silenceTexts.length > 0 && (
          <div className={styles.silenceTextList}>
            {silenceTexts.map((item, idx) => (
              <div
                key={idx}
                className={`${styles.silenceTextItem} ${item?.type === "main" ? styles.silenceMainText : styles.silenceNormalText}`}
              >
                {String(item?.text || "")
                  .split("\n")
                  .map((line, lineIndex, arr) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < arr.length - 1 && <br />}
                    </span>
                  ))}
              </div>
            ))}
          </div>
        )}

        {restartHighlight?.dateStr && (
          <div className={styles.restartCard}>
            <div className={styles.restartCardHeader}>
              <div className={styles.restartCardTitle}>重新开始的那天</div>
              <button
                type="button"
                className={styles.restartCardDate}
                onClick={() => openDateModal(restartHighlight.dateStr)}
                title="查看当天记录"
              >
                {formatMonthDay(restartHighlight.dateStr, { alwaysShowYear: false })}
              </button>
            </div>

            <div className={styles.restartQuoteBlock}>
              <div className={styles.restartQuoteText}>
                {restartHighlight.firstSentence ? `“${restartHighlight.firstSentence}”` : "—"}
              </div>
            </div>

            <div className={styles.restartGuide}>
              <div className={styles.restartGuideTitle}>那天可能发生了这些事</div>
              <ul className={styles.restartGuideList}>
                <li>一个普通的早晨，你决定重新开始</li>
                <li>某个特别的瞬间让你想记录</li>
                <li>积攒了太久的话终于想说</li>
                <li>...</li>
              </ul>
            </div>

          </div>
        )}
      </div>

      {showDateModal && (
        <div
          className={styles.dateModalOverlay}
          onClick={() => setShowDateModal(false)}
        >
          <div
            className={styles.dateModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dateModalHeader}>
              <div className={styles.dateModalTitle}>
                {selectedDate ? formatMonthDay(selectedDate, { alwaysShowYear: true }) : "—"}
              </div>
              <button
                type="button"
                className={styles.dateModalClose}
                onClick={() => setShowDateModal(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {selectedList.length > 0 ? (
              <div className={styles.dateModalList}>
                {selectedList.map((d, idx) => {
                  const time = getTimeStringFromDynamic(d);
                  const text = truncateText(d?.text || "", 120);
                  const imgCount = Array.isArray(d?.images) ? d.images.length : 0;
                  const vidCount = Array.isArray(d?.videos) ? d.videos.length : 0;

                  return (
                    <div key={`${d?.timestamp || idx}`} className={styles.dateModalItem}>
                      <div className={styles.dateModalItemHeader}>
                        <div className={styles.dateModalItemTime}>{time}</div>
                        <div className={styles.dateModalItemMedia}>
                          {imgCount > 0 && <span>🖼 {imgCount}</span>}
                          {vidCount > 0 && <span>🎞 {vidCount}</span>}
                        </div>
                      </div>
                      {text && <div className={styles.dateModalItemText}>{text}</div>}
                      {!text && (imgCount > 0 || vidCount > 0) && (
                        <div className={styles.dateModalItemTextMuted}>这条记录用画面留住了当时。</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.dateModalEmpty}>这一天没有找到可展示的记录。</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Chapter7.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter7;
