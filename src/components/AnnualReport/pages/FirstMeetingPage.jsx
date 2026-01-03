import styles from "./FirstMeetingPage.module.less";

/**
 * 第一次相遇页面
 */
const FirstMeetingPage = ({ reportData }) => {
  const { firstMeetingInfo } = reportData;

  if (!firstMeetingInfo || !firstMeetingInfo.firstDate) {
    return null;
  }

  const { firstDate, daysPassed, yearsPassed } = firstMeetingInfo;

  // 按照半年的颗粒度展示文案
  // 例如：4.1年 -> 快四年半，4.6年 -> 快五年
  const getYearText = (years) => {
    const baseYear = Math.floor(years);
    const decimal = years - baseYear;
    
    if (decimal < 0.3) {
      // 0 ~ 0.3：快X年
      return `${baseYear}年`;
    } else if (decimal < 0.6) {
      // 0.3 ~ 0.6：快X年半
      return `${baseYear}年半`;
    } else {
      // 0.6 ~ 1.0：快X+1年
      return `${baseYear + 1}年`;
    }
  };

  const yearText = getYearText(yearsPassed);

  return (
    <div className={styles.firstMeetingPage}>
      <div className={styles.content}>
        {/* 第一次相遇日期 */}
        <div className={styles.dateText}>{firstDate}</div>
        
        {/* 第一次相遇文案 */}
        <div className={styles.meetingText}>我们第一次相遇</div>
        
        {/* 发光人物剪影 */}
        <div className={styles.figureContainer}>
          <div className={styles.figure}></div>
        </div>
        
        {/* 天数文案 */}
        <div className={styles.daysText}>
          转眼过去<span className={styles.daysNumber}>{daysPassed}</span>天
        </div>
        
        {/* 年份文案 */}
        <div className={styles.yearsText}>已经快{yearText}</div>
      </div>
    </div>
  );
};

export default FirstMeetingPage;

