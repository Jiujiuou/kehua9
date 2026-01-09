import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import ImagePreview from "@/components/Basic/ImagePreview";
import VideoPreview from "@/components/Basic/VideoPreview";
import DynamicCard from "@/components/Basic/DynamicCard";
import styles from "./Chapter3.module.less";

const Chapter3 = ({
  dynamics = [],
  // 样式配置，与 Preview 区域保持一致
  textIndent = true,
  paragraphSpacing = false,
  fontSize = 15,
  fontWeight = 400,
  fontFamily = "system",
  lineHeight = 1.6,
  contentGap = 12,
  borderRadius = 8,
  imageGap = 4,
  onPreviewClick,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewVideoIndex, setPreviewVideoIndex] = useState(0);

  useEffect(() => {
    // 延迟显示内容，添加淡入动画
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 找到最长和最短的动态
  const { longestPost, shortestPost } = useMemo(() => {
    if (!dynamics || dynamics.length === 0) {
      return { longestPost: null, shortestPost: null };
    }

    // 过滤出有文本内容的动态
    const postsWithText = dynamics.filter(
      (dynamic) => dynamic && dynamic.text && dynamic.text.trim().length > 0
    );

    if (postsWithText.length === 0) {
      return { longestPost: null, shortestPost: null };
    }

    // 找到最长和最短的动态
    let longest = postsWithText[0];
    let shortest = postsWithText[0];

    postsWithText.forEach((post) => {
      const textLength = post.text.trim().length;
      if (textLength > longest.text.trim().length) {
        longest = post;
      }
      if (textLength < shortest.text.trim().length) {
        shortest = post;
      }
    });

    return { longestPost: longest, shortestPost: shortest };
  }, [dynamics]);

  // 格式化日期时间显示（和 preview 区域保持一致）
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  // 为 DynamicCard 准备动态数据（需要 date 和 time 字段）
  const prepareDynamicForCard = (dynamic) => {
    if (!dynamic) return null;
    return {
      ...dynamic,
      date: formatDateTime(dynamic.timestamp).split(" ")[0],
      time: formatDateTime(dynamic.timestamp).split(" ")[1] || "",
    };
  };

  // 找到动态在原始数组中的索引
  const findDynamicIndex = (targetDynamic) => {
    if (!targetDynamic) return 0;
    return dynamics.findIndex((d) => d.timestamp === targetDynamic.timestamp);
  };

  // 处理预览点击
  const handlePreviewClick = (dynamic) => {
    if (onPreviewClick) {
      const index = findDynamicIndex(dynamic);
      onPreviewClick(dynamic, index);
    }
  };

  return (
    <div className={styles.chapter3Content}>
      <div
        className={`${styles.content} ${
          showContent ? styles.fadeIn : styles.hidden
        }`}
      >
        <div className={styles.textWrapper}>
          <h2 className={styles.title}>表达光谱的两极</h2>
          <p className={styles.subtitle}>从最绵长的倾诉，到最刹那的灵感。</p>
        </div>

        {longestPost && shortestPost && (
          <div className={styles.postsContainer}>
            {/* 左侧：最绵长的沉思 */}
            <div className={styles.postCard}>
              <div className={styles.postHeader}>
                <h3 className={styles.postTitle}>
                  最绵长的沉思 · {longestPost.text.trim().length}字
                </h3>
              </div>
              <DynamicCard
                dynamic={prepareDynamicForCard(longestPost)}
                index={0}
                contentGap={contentGap}
                borderRadius={borderRadius}
                imageGap={imageGap}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                lineHeight={lineHeight}
                textIndent={textIndent}
                paragraphSpacing={paragraphSpacing}
                showPreviewButton={false}
                showDeleteButton={false}
                textClassName={styles.truncatedText}
                allowContentClickToPreview={true}
                onPreviewClick={handlePreviewClick}
                onImageClick={(images, imgIndex) => {
                  setPreviewImages(images);
                  setPreviewIndex(imgIndex);
                }}
                onVideoClick={(videos, vidIndex) => {
                  setPreviewVideos(videos);
                  setPreviewVideoIndex(vidIndex);
                }}
              />
              <p className={styles.postInterpretation}>
                有些心事，需要足够的篇幅来安放。
              </p>
            </div>

            {/* 右侧：最刹那的火花 */}
            <div className={styles.postCard}>
              <div className={styles.postHeader}>
                <h3 className={styles.postTitle}>
                  最刹那的火花 · {shortestPost.text.trim().length}字
                </h3>
              </div>
              <DynamicCard
                dynamic={prepareDynamicForCard(shortestPost)}
                index={1}
                contentGap={contentGap}
                borderRadius={borderRadius}
                imageGap={imageGap}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                lineHeight={lineHeight}
                textIndent={textIndent}
                paragraphSpacing={paragraphSpacing}
                showPreviewButton={false}
                showDeleteButton={false}
                allowContentClickToPreview={true}
                onPreviewClick={handlePreviewClick}
                onImageClick={(images, imgIndex) => {
                  setPreviewImages(images);
                  setPreviewIndex(imgIndex);
                }}
                onVideoClick={(videos, vidIndex) => {
                  setPreviewVideos(videos);
                  setPreviewVideoIndex(vidIndex);
                }}
              />
              <p className={styles.postInterpretation}>
                瞬间的感受，也被你精准捕捉。
              </p>
            </div>
          </div>
        )}
      </div>
      <ImagePreview
        images={previewImages}
        currentIndex={previewIndex}
        onClose={() => {
          setPreviewImages([]);
          setPreviewIndex(0);
        }}
      />
      <VideoPreview
        videos={previewVideos}
        currentIndex={previewVideoIndex}
        onClose={() => {
          setPreviewVideos([]);
          setPreviewVideoIndex(0);
        }}
      />
    </div>
  );
};

Chapter3.propTypes = {
  dynamics: PropTypes.array,
  // 样式配置
  textIndent: PropTypes.bool,
  paragraphSpacing: PropTypes.bool,
  fontSize: PropTypes.number,
  fontWeight: PropTypes.number,
  fontFamily: PropTypes.string,
  lineHeight: PropTypes.number,
  contentGap: PropTypes.number,
  borderRadius: PropTypes.number,
  imageGap: PropTypes.number,
  // 事件处理
  onPreviewClick: PropTypes.func,
};

export default Chapter3;
