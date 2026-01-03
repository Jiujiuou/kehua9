import PropTypes from "prop-types";
import styles from "./AchievementsPage.module.less";

/**
 * 成就徽章页
 */
const AchievementsPage = ({ reportData }) => {
  const { achievements } = reportData;

  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div className={styles.achievementsPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>你的成就</h2>
        <p className={styles.subtitle}>这些徽章，记录着你的坚持与成长</p>

        {/* 成就徽章列表 */}
        <div className={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={styles.achievementCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.achievementIcon}>{achievement.icon}</div>
              <div className={styles.achievementContent}>
                <div className={styles.achievementTitle}>{achievement.title}</div>
                <div className={styles.achievementDescription}>
                  {achievement.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

AchievementsPage.propTypes = {
  reportData: PropTypes.shape({
    achievements: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
      })
    ),
  }).isRequired,
};

export default AchievementsPage;

