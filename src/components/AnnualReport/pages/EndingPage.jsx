import styles from "./EndingPage.module.less";

/**
 * 结尾页
 */
const EndingPage = ({ reportData, onShare, onClose }) => {
  const { isFullReport, daysUntilEnd, firstDynamicDate } = reportData;

  return (
    <div className={styles.endingPage}>
      <div className={styles.content}>
        <div className={styles.mainMessage}>
          <div className={styles.timelineBox}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineLabel}>第一条动态</div>
              <div className={styles.timelineValue}>{firstDynamicDate}</div>
            </div>
            <div className={styles.timelineDivider}>→</div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineLabel}>相伴至今</div>
              <div className={styles.timelineValue}>2025年12月31日</div>
            </div>
          </div>

          <div className={styles.daysBox}>
            <div className={styles.daysValue}>{daysUntilEnd}</div>
            <div className={styles.daysLabel}>天的美好时光</div>
          </div>

          <div className={styles.message}>
            {isFullReport ? (
              <>
                <p>这些文字，这些画面，这些瞬间</p>
                <p>都是你走过的路</p>
                <p className={styles.highlight}>可话陪你记录了这一切</p>
              </>
            ) : (
              <>
                <p>2025年的每一个瞬间</p>
                <p>都值得被记住</p>
                <p className={styles.highlight}>感谢与你一起度过这一年</p>
              </>
            )}
          </div>

          <div className={styles.farewell}>
            <p>虽然旅程即将告一段落</p>
            <p>但这些回忆会一直陪伴着你</p>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.farewell}>
            <p>相信有一天可话会回来的</p>
            <p>在此之前，请你务必照顾好自己</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndingPage;
