import { useState } from "react";
import { MdDeleteOutline } from "react-icons/md";
import { HiOutlineEye, HiDownload } from "react-icons/hi";
import PropTypes from "prop-types";
import { getFontFamily } from "@/utils/fonts";
import styles from "./index.module.less";

const DynamicCard = ({
  dynamic,
  index,
  // 样式相关 props
  contentGap = 12,
  borderRadius = 8,
  imageGap = 4,
  fontSize = 15,
  fontWeight = 400,
  fontFamily = "system",
  lineHeight = 1.6,
  textIndent = true,
  paragraphSpacing = false,
  // 功能相关 props
  searchKeyword = "",
  highlightKeyword,
  // 事件处理
  onPreviewClick,
  onDeleteClick,
  onImageClick,
  onVideoClick,
  onImageDownload,
  // 其他
  directoryHandle = null,
  showDeleteButton = false,
  showPreviewButton = true,
  textClassName = "", // 自定义文本容器的 className
  allowContentClickToPreview = false, // 是否允许点击内容区域打开预览卡片
}) => {
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null);

  // 默认的高亮函数
  const defaultHighlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;

    const regex = new RegExp(
      `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, partIndex) => {
      if (part.toLowerCase() === keyword.toLowerCase()) {
        return (
          <mark key={partIndex} className={styles.highlight}>
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const highlightFn = highlightKeyword || defaultHighlightKeyword;

  // 处理内容区域点击事件
  const handleContentClick = (e) => {
    // 如果允许点击内容区域打开预览，且点击的不是图片、视频或按钮
    if (
      allowContentClickToPreview &&
      onPreviewClick &&
      !e.target.closest(`.${styles.imageWrapper}`) &&
      !e.target.closest(`.${styles.headerIcons}`) &&
      !e.target.closest(`.${styles.imageDownloadButton}`)
    ) {
      e.stopPropagation();
      onPreviewClick(dynamic, index);
    }
  };

  const handleImageDownload = async (event, image, imgIndex) => {
    event.stopPropagation();
    if (onImageDownload) {
      onImageDownload(event, image, imgIndex);
    } else {
      // 默认下载逻辑
      try {
        // 如果图片对象有 file 字段，直接使用原文件下载（保证原画质）
        if (image.file && image.file instanceof File) {
          const url = window.URL.createObjectURL(image.file);
          const link = document.createElement("a");
          link.href = url;
          link.download =
            image.name || image.file.name || `image-${imgIndex + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          return;
        }

        // 如果是 data URL，直接下载（data URL 包含完整的原图数据）
        if (image.url && image.url.startsWith("data:")) {
          const link = document.createElement("a");
          link.href = image.url;
          link.download = image.name || `image-${imgIndex + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }

        // 其他情况，fetch 下载
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = image.name || `image-${imgIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("下载图片失败:", error);
      }
    }
  };

  return (
    <div
      className={styles.dynamicItem}
      data-date={dynamic.date}
      data-dynamic-index={index}
      style={{
        padding: `${contentGap}px`,
        borderRadius: `${borderRadius}px`,
        cursor: allowContentClickToPreview ? "pointer" : "default",
      }}
      onClick={allowContentClickToPreview ? handleContentClick : undefined}
    >
      <div className={styles.dynamicHeader}>
        <span className={styles.dynamicDate}>
          {dynamic.date} {dynamic.time}
        </span>
        <div className={styles.headerIcons}>
          {showPreviewButton && (
            <HiOutlineEye
              className={styles.previewIcon}
              onClick={(e) => {
                e.stopPropagation();
                if (onPreviewClick) {
                  onPreviewClick(dynamic, index);
                }
              }}
              title="卡片预览"
            />
          )}
          {showDeleteButton && (
            <MdDeleteOutline
              className={styles.deleteIcon}
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteClick) {
                  onDeleteClick(dynamic, index);
                }
              }}
              title="删除动态"
            />
          )}
        </div>
      </div>
      {dynamic.text && (
        <div className={`${styles.dynamicText} ${textClassName}`.trim()}>
          {dynamic.text.split("\n").map((paragraph, paragraphIndex, array) => {
            // 如果是空段落，只渲染一个空行
            if (!paragraph.trim()) {
              return (
                <div
                  key={paragraphIndex}
                  className={styles.dynamicParagraph}
                ></div>
              );
            }
            // 判断是否是最后一段
            const isLastParagraph = paragraphIndex === array.length - 1;
            return (
              <div
                key={paragraphIndex}
                className={styles.dynamicParagraph}
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
                {searchKeyword.trim()
                  ? highlightFn(paragraph, searchKeyword.trim())
                  : paragraph}
              </div>
            );
          })}
        </div>
      )}
      {dynamic.images && dynamic.images.length > 0 && (
        <div
          className={styles.dynamicImages}
          data-image-count={Math.min(dynamic.images.length, 9)}
          style={{ gap: `${imageGap}px` }}
        >
          {dynamic.images.slice(0, 9).map((image, imgIndex) => {
            const imageKey = `${dynamic.timestamp}-${imgIndex}`;
            const isHovered = hoveredImageIndex === imageKey;

            return (
              <div
                key={imgIndex}
                className={styles.imageWrapper}
                onMouseEnter={() => setHoveredImageIndex(imageKey)}
                onMouseLeave={() => setHoveredImageIndex(null)}
                onClick={() => {
                  if (onImageClick) {
                    onImageClick(dynamic.images, imgIndex);
                  }
                }}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className={styles.dynamicImage}
                />
                {isHovered && (
                  <div
                    className={styles.imageDownloadButton}
                    onClick={(e) => handleImageDownload(e, image, imgIndex)}
                    title="下载图片"
                  >
                    <HiDownload />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {dynamic.videos && dynamic.videos.length > 0 && (
        <div
          className={styles.dynamicImages}
          data-image-count={Math.min(dynamic.videos.length, 9)}
          style={{ gap: `${imageGap}px` }}
        >
          {dynamic.videos.slice(0, 9).map((video, vidIndex) => (
            <div
              key={vidIndex}
              className={styles.imageWrapper}
              onClick={() => {
                if (onVideoClick) {
                  onVideoClick(dynamic.videos, vidIndex);
                }
              }}
            >
              <video
                src={video.url}
                className={styles.dynamicImage}
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
  );
};

DynamicCard.propTypes = {
  dynamic: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  // 样式相关
  contentGap: PropTypes.number,
  borderRadius: PropTypes.number,
  imageGap: PropTypes.number,
  fontSize: PropTypes.number,
  fontWeight: PropTypes.number,
  fontFamily: PropTypes.string,
  lineHeight: PropTypes.number,
  textIndent: PropTypes.bool,
  paragraphSpacing: PropTypes.bool,
  // 功能相关
  searchKeyword: PropTypes.string,
  highlightKeyword: PropTypes.func,
  // 事件处理
  onPreviewClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  onImageClick: PropTypes.func,
  onVideoClick: PropTypes.func,
  onImageDownload: PropTypes.func,
  // 其他
  directoryHandle: PropTypes.object,
  showDeleteButton: PropTypes.bool,
  showPreviewButton: PropTypes.bool,
  textClassName: PropTypes.string,
  allowContentClickToPreview: PropTypes.bool,
};

export default DynamicCard;
