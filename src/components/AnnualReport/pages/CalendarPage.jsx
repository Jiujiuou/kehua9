import PropTypes from "prop-types";
import YearCalendar from "../components/YearCalendar";
import styles from "./CalendarPage.module.less";

/**
 * 日历页
 */
const CalendarPage = ({ reportData }) => {
  const { dynamics, calendarText, isFullReport, year } = reportData;

  return (
    <div className={styles.calendarPage}>
      <div className={styles.content}>
        <div className={styles.title}>点亮的日子</div>

        {/* 使用完整句子描述替代数据展示 */}
        {calendarText && calendarText.length > 0 && (
          <div className={styles.textSection}>
            {calendarText.map((item, index) => (
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

        <div className={styles.calendarSection}>
          <YearCalendar dynamics={dynamics} year={isFullReport ? null : year} />
        </div>
      </div>
    </div>
  );
};

CalendarPage.propTypes = {
  reportData: PropTypes.shape({
    year: PropTypes.number,
    isFullReport: PropTypes.bool,
    companionDays: PropTypes.number,
    longestStreak: PropTypes.number,
    dynamics: PropTypes.array,
    mostActiveWeekday: PropTypes.shape({
      dayName: PropTypes.string,
      count: PropTypes.number,
      percentage: PropTypes.number,
    }),
    calendarText: PropTypes.array,
  }).isRequired,
};

export default CalendarPage;
