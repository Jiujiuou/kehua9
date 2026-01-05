import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import styles from "./index.module.less";

const ImagePreview = ({ images = [], currentIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isHovered, setIsHovered] = useState(false);

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

  const handleDownload = async (event) => {
    event.stopPropagation();
    try {
      const imageUrl = currentImage.url || currentImage;
      
      // 如果图片对象有 file 字段，直接使用原文件下载（保证原画质）
      if (currentImage.file && currentImage.file instanceof File) {
        const url = window.URL.createObjectURL(currentImage.file);
        const link = document.createElement("a");
        link.href = url;
        link.download = currentImage.name || currentImage.file.name || `image-${activeIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
      
      // 如果是 data URL，直接下载（data URL 包含完整的原图数据）
      if (imageUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = currentImage.name || `image-${activeIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // 其他情况，fetch 下载（可能是 blob URL 或其他 URL）
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // 从 URL 中提取文件名，如果没有则使用默认名称
      const urlParts = imageUrl.split("/");
      const fileName = currentImage.name || urlParts[urlParts.length - 1] || `image-${activeIndex + 1}.jpg`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("下载图片失败:", error);
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
      <div
        className={styles.imageContainer}
        onClick={handleImageContainerClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={currentImage.url || currentImage}
          alt="预览"
          className={styles.previewImage}
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
        {isHovered && (
          <div
            className={styles.downloadButton}
            onClick={handleDownload}
            title="下载图片"
          >
            <HiDownload />
          </div>
        )}
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

