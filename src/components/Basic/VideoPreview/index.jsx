import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./index.module.less";

const VideoPreview = ({ videos = [], currentIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const videoRef = useRef(null);

  // 当外部传入的 currentIndex 变化时，更新内部状态
  useEffect(() => {
    if (currentIndex !== undefined) {
      setActiveIndex(currentIndex);
    }
  }, [currentIndex]);

  const currentVideo = videos && videos.length > 0 ? videos[activeIndex] : null;
  const hasPrevious = activeIndex > 0;
  const hasNext = videos && activeIndex < videos.length - 1;

  // 当切换视频时，暂停当前视频并播放新视频
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      // 延迟播放，确保视频已加载
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.log("视频自动播放失败:", error);
          });
        }
      }, 100);
    }
  }, [activeIndex]);

  // 点击 ESC 键关闭，支持左右箭头键切换
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      } else if (event.key === "ArrowRight" && videos && activeIndex < videos.length - 1) {
        setActiveIndex(activeIndex + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // 防止背景滚动
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, activeIndex, videos]);

  const handlePrevious = () => {
    if (hasPrevious) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleBackdropClick = (event) => {
    // 如果点击的是背景（previewOverlay），则关闭
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleVideoContainerClick = (event) => {
    // 如果点击的是视频容器本身（不是视频），则关闭
    if (event.target === event.currentTarget) {
      onClose();
    }
    // 如果点击的是视频，不关闭（事件会冒泡，但我们已经检查了）
  };

  const handleArrowClick = (event, direction) => {
    event.stopPropagation();
    if (direction === "prev" && hasPrevious) {
      handlePrevious();
    } else if (direction === "next" && hasNext) {
      handleNext();
    }
  };

  if (!currentVideo || !videos || videos.length === 0) {
    return null;
  }

  return (
    <div className={styles.previewOverlay} onClick={handleBackdropClick}>
      {hasPrevious && (
        <div
          className={styles.navArrow}
          onClick={(e) => handleArrowClick(e, "prev")}
        >
          <FaChevronLeft />
        </div>
      )}
      <div className={styles.videoContainer} onClick={handleVideoContainerClick}>
        <video
          ref={videoRef}
          src={currentVideo.url || currentVideo}
          className={styles.previewVideo}
          controls
          playsInline
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      {hasNext && (
        <div
          className={styles.navArrow}
          onClick={(e) => handleArrowClick(e, "next")}
        >
          <FaChevronRight />
        </div>
      )}
    </div>
  );
};

VideoPreview.propTypes = {
  videos: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string.isRequired,
      }),
    ])
  ),
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

export default VideoPreview;

