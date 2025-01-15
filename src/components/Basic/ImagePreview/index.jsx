import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./index.module.less";

const ImagePreview = ({ images = [], currentIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  // 当外部传入的 currentIndex 变化时，更新内部状态
  useEffect(() => {
    if (currentIndex !== undefined) {
      setActiveIndex(currentIndex);
    }
  }, [currentIndex]);

  const currentImage = images && images.length > 0 ? images[activeIndex] : null;
  const hasPrevious = activeIndex > 0;
  const hasNext = images && activeIndex < images.length - 1;

  // 点击 ESC 键关闭，支持左右箭头键切换
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      } else if (event.key === "ArrowRight" && images && activeIndex < images.length - 1) {
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
  }, [onClose, activeIndex, images]);

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

  const handleImageContainerClick = (event) => {
    // 如果点击的是图片容器本身（不是图片），则关闭
    if (event.target === event.currentTarget) {
      onClose();
    }
    // 如果点击的是图片，不关闭（事件会冒泡，但我们已经检查了）
  };

  const handleArrowClick = (event, direction) => {
    event.stopPropagation();
    if (direction === "prev" && hasPrevious) {
      handlePrevious();
    } else if (direction === "next" && hasNext) {
      handleNext();
    }
  };

  if (!currentImage || !images || images.length === 0) {
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
      <div className={styles.imageContainer} onClick={handleImageContainerClick}>
        <img
          src={currentImage.url || currentImage}
          alt="预览"
          className={styles.previewImage}
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

ImagePreview.propTypes = {
  images: PropTypes.arrayOf(
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

export default ImagePreview;

