import styles from "./CoverPage.module.less";

/**
 * 年度报告封面页
 */
const CoverPage = ({ reportData, onStart }) => {
  const { year, isFullReport, coverText } = reportData;

  return (
    <div className={styles.coverPage}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {isFullReport ? "你的可话时光" : `${year}`}
        </h1>
        <div className={styles.subtitle}>
          {isFullReport ? "这些年，你在这里" : `这一年，你在这里`}
        </div>

        <div className={styles.preview}>
          {coverText && (
            <>
              <div className={styles.mainText}>{coverText.mainText}</div>
              <div className={styles.subText}>{coverText.subText}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverPage;
