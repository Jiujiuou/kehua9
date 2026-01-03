import styles from './TagsAndBadgesPage.module.less';

/**
 * 标签和徽章页
 */
const TagsAndBadgesPage = ({ reportData }) => {
  const { userTags, achievements } = reportData;

  return (
    <div className={styles.tagsAndBadgesPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>你的印记</h2>
        <p className={styles.subtitle}>属于你的</p>

        {/* 个性化标签 */}
        {userTags && userTags.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>标签</h3>
            <div className={styles.tagsGrid}>
              {userTags.map((tag, index) => (
                <div key={index} className={styles.tagCard}>
                  <div className={styles.tagTitle}>{tag.title}</div>
                  <div className={styles.tagDesc}>{tag.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 成就徽章 */}
        {achievements && achievements.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>成就</h3>
            <div className={styles.badgesGrid}>
              {achievements.map((badge, index) => (
                <div key={index} className={styles.badgeCard}>
                  <div className={styles.badgeTitle}>{badge.title}</div>
                  <div className={styles.badgeDesc}>{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!userTags || userTags.length === 0) && (!achievements || achievements.length === 0) && (
          <div className={styles.emptyState}>
            <div className={styles.emptyText}>继续记录</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsAndBadgesPage;

