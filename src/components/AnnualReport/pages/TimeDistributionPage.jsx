import PropTypes from "prop-types";
import HourlyActivityRiver from "../components/HourlyActivityRiver";
import styles from "./TimeDistributionPage.module.less";

/**
 * 时间分布页
 */
const TimeDistributionPage = ({ reportData }) => {
  const { hourlyStats, mostActiveHour, timeDistributionText } = reportData;

  return (
    <div className={styles.timeDistributionPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>时光流转</h2>
        <p className={styles.subtitle}>记录你一天中的活跃轨迹</p>

        <div className={styles.riverSection}>
          <HourlyActivityRiver
            hourlyStats={hourlyStats}
            mostActiveHour={mostActiveHour}
          />
        </div>

        {/* 使用场景化文案替代数据描述 */}
        {timeDistributionText && timeDistributionText.length > 0 && (
          <div className={styles.textSection}>
            {timeDistributionText.map((item, index) => (
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
      </div>
    </div>
  );
};

TimeDistributionPage.propTypes = {
  reportData: PropTypes.shape({
    hourlyStats: PropTypes.array,
    mostActiveHour: PropTypes.shape({
      hour: PropTypes.number,
      count: PropTypes.number,
      percentage: PropTypes.number,
    }),
    lateNightStats: PropTypes.shape({
      count: PropTypes.number,
    }),
    timeDistributionText: PropTypes.array,
  }).isRequired,
};

export default TimeDistributionPage;
