import PropTypes from "prop-types";
import styles from "./MonthlyReviewPage.module.less";

/**
 * 月度回顾页
 */
const MonthlyReviewPage = ({ reportData }) => {
  const { monthlyStats, monthlyReviewText, year, isFullReport } = reportData;

  if (!monthlyStats || monthlyStats.length === 0) {
    return null;
  }

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // 找出最活跃和最安静的月份
  const sortedMonths = [...monthlyStats].sort((a, b) => b.count - a.count);
  const mostActiveMonth = sortedMonths[0];
  const quietestMonth = sortedMonths.find(m => m.count > 0 && m.count < mostActiveMonth.count) || sortedMonths[sortedMonths.length - 1];
  const emptyMonths = monthlyStats.filter(m => m.count === 0);

  return (
    <div className={styles.monthlyReviewPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>月度回顾</h2>
        <p className={styles.subtitle}>
          {isFullReport ? "这些年，每个月的足迹" : `${year}年，每个月的足迹`}
        </p>

        {/* 月度文案 */}
        {monthlyReviewText && monthlyReviewText.length > 0 && (
          <div className={styles.textSection}>
            {monthlyReviewText.map((item, index) => (
              <div
                key={index}
                className={`${styles.textItem} ${
                  item.type === "main" ? styles.mainText : styles.normalText
                }`}
              >
                {item.text}
              </div>
            ))}
          </div>
        )}

        {/* 月份卡片网格 */}
        <div className={styles.monthsGrid}>
          {monthlyStats.map((monthStat, index) => {
            const monthName = monthNames[index];
            const isActive = monthStat.count > 0;
            const isMostActive = monthStat.month === mostActiveMonth.month;
            
            return (
              <div
                key={monthStat.month}
                className={`${styles.monthCard} ${
                  !isActive ? styles.emptyMonth : ''
                } ${isMostActive ? styles.mostActiveMonth : ''}`}
              >
                <div className={styles.monthName}>{monthName}</div>
                <div className={styles.monthCount}>
                  {isActive ? monthStat.count : '—'}
                </div>
                {isMostActive && (
                  <div className={styles.mostActiveBadge}>★</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

MonthlyReviewPage.propTypes = {
  reportData: PropTypes.shape({
    monthlyStats: PropTypes.arrayOf(
      PropTypes.shape({
        month: PropTypes.number,
        count: PropTypes.number,
      })
    ),
    monthlyReviewText: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string,
      })
    ),
    year: PropTypes.number,
    isFullReport: PropTypes.bool,
  }).isRequired,
};

export default MonthlyReviewPage;

