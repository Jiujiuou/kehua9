import { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  FaChevronLeft,
  FaChevronRight,
  FaRandom,
  FaTimes,
} from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import logoImage from "@/assets/images/logo_transparent.png";
import { getFontFamily } from "@/utils/fonts";
import { downloadElementAsImage } from "@/utils/downloadImage";
import styles from "./index.module.less";

const CardPreview = ({
  dynamic,
  dynamics = [],
  currentIndex = 0,
  onClose,
  onDynamicChange,
  fontSize = 15,
  fontWeight = 400,
  fontFamily = "system",
  lineHeight = 1.6,
  textIndent = true,
  paragraphSpacing = false,
  allowNavigation = true, // 是否允许左右切换和随机切换
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isHovered, setIsHovered] = useState(false);
  const cardContainerRef = useRef(null);
  const downloadButtonRef = useRef(null);

  // 当外部传入的 currentIndex 变化时，更新内部状态
  useEffect(() => {
    if (currentIndex !== undefined && dynamics.length > 0) {
      setActiveIndex(currentIndex);
    }
  }, [currentIndex, dynamics.length]);

  const currentDynamic =
    dynamics && dynamics.length > 0 ? dynamics[activeIndex] : dynamic;
  const hasPrevious = activeIndex > 0;
  const hasNext = dynamics && activeIndex < dynamics.length - 1;

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      if (onDynamicChange && dynamics[newIndex]) {
        onDynamicChange(dynamics[newIndex], newIndex);
      }
    }
  }, [activeIndex, dynamics, onDynamicChange]);

  const handleNext = useCallback(() => {
    if (dynamics && activeIndex < dynamics.length - 1) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      if (onDynamicChange && dynamics[newIndex]) {
        onDynamicChange(dynamics[newIndex], newIndex);
      }
    }
  }, [activeIndex, dynamics, onDynamicChange]);

  const handleRandomClick = useCallback(
    (event) => {
      event.stopPropagation();
      if (dynamics && dynamics.length > 0) {
        // 随机选择一个索引，确保不是当前索引
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * dynamics.length);
        } while (randomIndex === activeIndex && dynamics.length > 1);

        setActiveIndex(randomIndex);
        if (onDynamicChange && dynamics[randomIndex]) {
          onDynamicChange(dynamics[randomIndex], randomIndex);
        }
      }
    },
    [dynamics, activeIndex, onDynamicChange],
  );

  // 格式化日期：YYYY/MM/DD
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  }, []);

  const handleDownload = useCallback(
    async (event) => {
      event.stopPropagation();
      if (!cardContainerRef.current) return;

      const currentDynamicData =
        dynamics && dynamics.length > 0 ? dynamics[activeIndex] : dynamic;
      if (!currentDynamicData || !currentDynamicData.timestamp) return;

      const formattedDate = formatDate(currentDynamicData.timestamp);
      const filename = `可话动态_${formattedDate.replace(/\//g, "-")}`;

      try {
        await downloadElementAsImage({
          element: cardContainerRef.current,
          filename: filename,
          excludeElement: downloadButtonRef.current,
          contentSelector: `.${styles.cardContent}`,
          backgroundColor: "#fef9f0",
          scaleFactor: 2,
        });
      } catch (error) {
        console.error("下载图片失败:", error);
      }
    },
    [dynamics, activeIndex, dynamic, formatDate],
  );

  // 点击 ESC 键关闭，支持左右箭头键切换（仅在允许导航时）
  useEffect(() => {
    if (!dynamic) return;

    const handleKeyDown = (event) => {
      // 确保事件没有被阻止
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (allowNavigation) {
        // 只有在允许导航时才支持左右箭头键切换
        if (event.key === "ArrowLeft" && hasPrevious) {
          event.preventDefault();
          handlePrevious();
        } else if (event.key === "ArrowRight" && hasNext) {
          event.preventDefault();
          handleNext();
        }
      }
    };

    // 使用 capture 阶段确保事件能被捕获
    document.addEventListener("keydown", handleKeyDown, true);
    // 防止背景滚动
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "";
    };
  }, [
    dynamic,
    onClose,
    hasPrevious,
    hasNext,
    handlePrevious,
    handleNext,
    allowNavigation,
  ]);

  // 如果没有传入 dynamic，则不显示预览
  if (!dynamic) {
    return null;
  }

  const handleArrowClick = (event, direction) => {
    event.stopPropagation();
    if (direction === "prev" && hasPrevious) {
      handlePrevious();
    } else if (direction === "next" && hasNext) {
      handleNext();
    }
  };

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

  if (!currentDynamic) {
    return null;
  }

  const formattedDate = formatDate(currentDynamic.timestamp);

  return (
    <div className={styles.previewOverlay} onClick={handleBackdropClick}>
      {allowNavigation ? (
        <div
          className={styles.randomButton}
          onClick={handleRandomClick}
          title="随机查看一条动态"
        >
          <FaRandom />
        </div>
      ) : (
        <div
          className={styles.closeButton}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="关闭"
        >
          <FaTimes />
        </div>
      )}
      {allowNavigation && hasPrevious && (
        <div
          className={`${styles.navArrow} ${styles.navArrowLeft}`}
          onClick={(e) => handleArrowClick(e, "prev")}
        >
          <FaChevronLeft />
        </div>
      )}
      {allowNavigation && hasNext && (
        <div
          className={`${styles.navArrow} ${styles.navArrowRight}`}
          onClick={(e) => handleArrowClick(e, "next")}
        >
          <FaChevronRight />
        </div>
      )}
      <div className={styles.cardWrapper}>
        <div
          ref={cardContainerRef}
          className={styles.cardContainer}
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && (
            <div
              ref={downloadButtonRef}
              className={styles.downloadButton}
              onClick={handleDownload}
              title="下载图片"
            >
              <HiDownload />
            </div>
          )}
          <div className={styles.cardInner}>
            <div className={styles.cardHeader}>
              <div className={styles.dateInfo}>{formattedDate} 发布于可话</div>
            </div>

            {/* 内容区域（可滚动） */}
            <div className={styles.cardContent}>
              {/* 中间：文字内容 */}
              {currentDynamic.text && (
                <div className={styles.cardText}>
                  {currentDynamic.text
                    .split("\n")
                    .map((paragraph, paragraphIndex, array) => {
                      // 如果是空段落，只渲染一个空行
                      if (!paragraph.trim()) {
                        return (
                          <div
                            key={paragraphIndex}
                            className={styles.textParagraph}
                          ></div>
                        );
                      }
                      // 判断是否是最后一段
                      const isLastParagraph =
                        paragraphIndex === array.length - 1;
                      return (
                        <div
                          key={paragraphIndex}
                          className={styles.textParagraph}
                          style={{
                            textIndent: textIndent ? "2em" : "0",
                            fontSize: `${fontSize}px`,
                            fontWeight: fontWeight,
                            fontFamily: getFontFamily(fontFamily),
                            lineHeight: lineHeight,
                            marginBottom:
                              paragraphSpacing && !isLastParagraph
                                ? `${lineHeight}em`
                                : `${lineHeight * 0.5}em`,
                          }}
                        >
                          {paragraph}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* 图片内容 */}
              {currentDynamic.images && currentDynamic.images.length > 0 && (
                <div className={styles.cardImages}>
                  {currentDynamic.images.map((image, index) => (
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
              {currentDynamic.videos && currentDynamic.videos.length > 0 && (
                <div className={styles.cardVideos}>
                  {currentDynamic.videos.map((video, index) => (
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
      }),
    ),
    videos: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        name: PropTypes.string,
      }),
    ),
  }),
  dynamics: PropTypes.array,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onDynamicChange: PropTypes.func,
  fontSize: PropTypes.number,
  fontWeight: PropTypes.number,
  fontFamily: PropTypes.string,
  lineHeight: PropTypes.oneOf([1.4, 1.5, 1.6, 1.8, 2.0]),
  textIndent: PropTypes.bool,
  paragraphSpacing: PropTypes.bool,
  allowNavigation: PropTypes.bool,
};

export default CardPreview;
