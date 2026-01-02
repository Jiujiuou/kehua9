import { useEffect } from "react";
import PropTypes from "prop-types";
import logoImage from "@/assets/images/logo_transparent.png";
import styles from "./index.module.less";

const CardPreview = ({ dynamic, onClose }) => {
  // 点击 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // 防止背景滚动
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleBackdropClick = (event) => {
    // 如果点击的是背景，则关闭
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleCardClick = (event) => {
    // 阻止事件冒泡，防止点击卡片时关闭
    event.stopPropagation();
  };

  if (!dynamic) {
    return null;
  }

  // 格式化日期：YYYY/MM/DD
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const formattedDate = formatDate(dynamic.timestamp);

  return (
    <div className={styles.previewOverlay} onClick={handleBackdropClick}>
      <div className={styles.cardContainer} onClick={handleCardClick}>
        <div className={styles.cardHeader}>
          <div className={styles.dateInfo}>{formattedDate} 发布于可话</div>
        </div>

        {/* 内容区域（可滚动） */}
        <div className={styles.cardContent}>
          {/* 中间：文字内容 */}
          {dynamic.text && (
            <div className={styles.cardText}>
              {dynamic.text.split("\n").map((paragraph, index) => (
                <div key={index} className={styles.textParagraph}>
                  {paragraph || "\u00A0"}
                </div>
              ))}
            </div>
          )}

          {/* 图片内容 */}
          {dynamic.images && dynamic.images.length > 0 && (
            <div className={styles.cardImages}>
              {dynamic.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url || image}
                  alt={image.name || `图片 ${index + 1}`}
                  className={styles.cardImage}
                />
              ))}
            </div>
          )}

          {/* 视频内容（静态缩略图） */}
          {dynamic.videos && dynamic.videos.length > 0 && (
            <div className={styles.cardVideos}>
              {dynamic.videos.map((video, index) => (
                <div key={index} className={styles.videoWrapper}>
                  <video
                    src={video.url || video}
                    className={styles.cardVideo}
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      // 加载第一帧作为缩略图
                      e.target.currentTime = 0.1;
                    }}
                  />
                  <div className={styles.videoPlayIcon}>▶</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部：推广信息 */}
        <div className={styles.cardFooter}>
          <div className={styles.promoText}>
            <img src={logoImage} alt="可话" className={styles.appLogo} />
            <span className={styles.promoDesc}>遇见共鸣</span>
            <img
              src={logoImage}
              alt="可话"
              className={`${styles.appLogo} ${styles.appLogoPlaceholder}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

CardPreview.propTypes = {
  dynamic: PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    text: PropTypes.string,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        name: PropTypes.string,
      })
    ),
    videos: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        name: PropTypes.string,
      })
    ),
  }),
  onClose: PropTypes.func.isRequired,
};

export default CardPreview;
