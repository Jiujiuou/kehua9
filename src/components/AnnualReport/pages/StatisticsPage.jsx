import StatCard from "../components/StatCard";
import styles from "./StatisticsPage.module.less";

/**
 * 统计概览页
 */
const StatisticsPage = ({ reportData }) => {
  const { statisticsText } = reportData;

  return (
    <div className={styles.statisticsPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>数字背后</h2>
        <p className={styles.subtitle}>每一个数字，都是真实的你</p>

        {/* 使用段落式文案替代数据卡片 */}
        {statisticsText && statisticsText.length > 0 && (
          <div className={styles.textSection}>
            {statisticsText.map((item, index) => (
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

export default StatisticsPage;
