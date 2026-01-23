import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_END_DATE } from "@/constant/annualReport";
import {
  calculateInclusiveDays,
  formatChineseDate,
  getDateStringFromDynamic,
} from "@/utils/annualReport";
import styles from "./FinalChapter.module.less";

/**
 * FinalChapter：结尾页
 * - 内容参考结尾页文案与结构，实现完全在 src 内
 * - 始终使用“所有年份”的全量 dynamics 来生成首条动态日期与相伴天数
 */
const FinalChapter = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showBody, setShowBody] = useState(false);

  const { firstDynamicDateStr, daysUntilEnd, endDateStr } = useMemo(() => {
    const endDateStr = ANNUAL_REPORT_END_DATE;

    // 找到最早的一条动态日期
    let first = null;
    (Array.isArray(dynamics) ? dynamics : []).forEach((d) => {
      const ds = getDateStringFromDynamic(d);
      if (!ds) return;
      if (!first || ds < first) first = ds;
    });

    const firstDynamicDateStr = first;
    const daysUntilEnd = firstDynamicDateStr
      ? calculateInclusiveDays(firstDynamicDateStr, endDateStr)
      : 0;

    return { firstDynamicDateStr, daysUntilEnd, endDateStr };
  }, [dynamics]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300);
    const t2 = setTimeout(() => setShowBody(true), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={styles.finalContent}>
      <div className={`${styles.title} ${showTitle ? styles.fadeIn : styles.hidden}`}>
        旅程的终点
      </div>

      <div className={`${styles.mainMessage} ${showBody ? styles.fadeIn : styles.hidden}`}>
        <div className={styles.timelineBox}>
          <div className={styles.timelineItem}>
            <div className={styles.timelineLabel}>第一条动态</div>
            <div className={styles.timelineValue}>
              {firstDynamicDateStr ? formatChineseDate(firstDynamicDateStr) : "—"}
            </div>
          </div>
          <div className={styles.timelineDivider}>→</div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineLabel}>相伴至今</div>
            <div className={styles.timelineValue}>{formatChineseDate(endDateStr)}</div>
          </div>
        </div>

        <div className={styles.daysBox}>
          <div className={styles.daysValue}>{daysUntilEnd}</div>
          <div className={styles.daysLabel}>天的美好时光</div>
        </div>

        <div className={styles.message}>
          <p>这些文字，这些画面，这些瞬间</p>
          <p>都是你走过的路</p>
          <p className={styles.highlight}>可话陪你记录了这一切</p>
        </div>

        <div className={styles.farewell}>
          <p>虽然旅程即将告一段落</p>
          <p>但这些回忆会一直陪伴着你</p>
        </div>

        <div className={styles.divider} />

        <div className={styles.farewell}>
          <p>相信有一天可话会回来的</p>
          <p>在此之前，请你务必照顾好自己</p>
        </div>
      </div>
    </div>
  );
};

FinalChapter.propTypes = {
  dynamics: PropTypes.array,
};

export default FinalChapter;
