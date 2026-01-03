import PropTypes from "prop-types";
import styles from "./HighlightsPage.module.less";

/**
 * 高光时刻页 - 突破性记录 + 第一条和最后一条动态
 */
const HighlightsPage = ({ reportData }) => {
  const { highlightsText, firstDynamic, lastDynamic } = reportData;

  return (
    <div className={styles.highlightsPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>那些瞬间</h2>

        {/* 使用自然语言文案替代大数字卡片 */}
        {highlightsText && highlightsText.length > 0 && (
          <div className={styles.textSection}>
            {highlightsText.map((item, index) => (
              <div key={index} className={styles.textItem}>
                {item.text}
              </div>
            ))}
          </div>
        )}

        {/* 第一条和最后一条动态回顾 */}
        <div className={styles.dynamicsSection}>
          {firstDynamic && (
            <div className={styles.dynamicCard}>
              <h3 className={styles.sectionTitle}>
                第一条动态（欢迎来到可话世界）
              </h3>
              <div className={styles.dynamicDate}>
                {new Date(firstDynamic.timestamp).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {firstDynamic.preview && (
                <div className={styles.dynamicContent}>
                  {firstDynamic.preview}
                </div>
              )}
              {firstDynamic.images && firstDynamic.images.length > 0 && (
                <div className={styles.dynamicMeta}>
                  {firstDynamic.images.length} 张照片
                </div>
              )}
              {firstDynamic.videos && firstDynamic.videos.length > 0 && (
                <div className={styles.dynamicMeta}>1 个视频</div>
              )}
            </div>
          )}

          {lastDynamic && (
            <div className={styles.dynamicCard}>
              <h3 className={styles.sectionTitle}>
                最后一条动态（倒数的日子里，有好好和朋友们道别吗）
              </h3>
              <div className={styles.dynamicDate}>
                {new Date(lastDynamic.timestamp).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {lastDynamic.preview && (
                <div className={styles.dynamicContent}>
                  {lastDynamic.preview}
                </div>
              )}
              {lastDynamic.images && lastDynamic.images.length > 0 && (
                <div className={styles.dynamicMeta}>
                  {lastDynamic.images.length} 张照片
                </div>
              )}
              {lastDynamic.videos && lastDynamic.videos.length > 0 && (
                <div className={styles.dynamicMeta}>1 个视频</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

HighlightsPage.propTypes = {
  reportData: PropTypes.shape({
    highlightsText: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string,
      })
    ),
    firstDynamic: PropTypes.shape({
      timestamp: PropTypes.number,
      preview: PropTypes.string,
      images: PropTypes.array,
      videos: PropTypes.array,
    }),
    lastDynamic: PropTypes.shape({
      timestamp: PropTypes.number,
      preview: PropTypes.string,
      images: PropTypes.array,
      videos: PropTypes.array,
    }),
  }).isRequired,
};

export default HighlightsPage;
