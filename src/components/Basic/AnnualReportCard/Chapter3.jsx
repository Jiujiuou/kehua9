import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { HiDownload } from "react-icons/hi";
import ImagePreview from "@/components/Basic/ImagePreview";
import VideoPreview from "@/components/Basic/VideoPreview";
import styles from "./Chapter3.module.less";

const Chapter3 = ({ dynamics = [] }) => {
  const [showContent, setShowContent] = useState(false);
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null);
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

  return (
    <div className={styles.chapter3Content}>
      <div
        className={`${styles.content} ${
          showContent ? styles.fadeIn : styles.hidden
        }`}
      >
        <div className={styles.textWrapper}>
          <h2 className={styles.title}>表达光谱的两极</h2>
          <p className={styles.subtitle}>
            从最绵长的倾诉，到最刹那的灵感。
          </p>
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
              <div className={styles.dynamicItem} style={{ padding: "16px", borderRadius: "8px" }}>
                <div className={styles.dynamicHeader}>
                  <span className={styles.dynamicDate}>
                    {formatDateTime(longestPost.timestamp)}
                  </span>
                </div>
                <div className={`${styles.dynamicText} ${styles.truncatedText}`}>
                  {longestPost.text
                    .split("\n")
                    .map((paragraph, index) => (
                      <div key={index} className={styles.dynamicParagraph}>
                        {paragraph || "\u00A0"}
                      </div>
                    ))}
                </div>
                {longestPost.images && longestPost.images.length > 0 && (
                  <div
                    className={styles.dynamicImages}
                    data-image-count={Math.min(longestPost.images.length, 9)}
                    style={{ gap: "8px" }}
                  >
                    {longestPost.images.slice(0, 9).map((image, imgIndex) => {
                      const imageKey = `longest-${longestPost.timestamp}-${imgIndex}`;
                      const isHovered = hoveredImageIndex === imageKey;

                      const handleDownload = async (event) => {
                        event.stopPropagation();
                        try {
                          if (image.file && image.file instanceof File) {
                            const url = window.URL.createObjectURL(image.file);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download =
                              image.name ||
                              image.file.name ||
                              `image-${imgIndex + 1}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            return;
                          }

                          if (image.url && image.url.startsWith("data:")) {
                            const link = document.createElement("a");
                            link.href = image.url;
                            link.download =
                              image.name || `image-${imgIndex + 1}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            return;
                          }

                          const response = await fetch(image.url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download =
                            image.name || `image-${imgIndex + 1}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error("下载图片失败:", error);
                        }
                      };

                      return (
                        <div
                          key={imgIndex}
                          className={styles.imageWrapper}
                          onMouseEnter={() => setHoveredImageIndex(imageKey)}
                          onMouseLeave={() => setHoveredImageIndex(null)}
                          onClick={() => {
                            setPreviewImages(longestPost.images);
                            setPreviewIndex(imgIndex);
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
                              onClick={handleDownload}
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
                {longestPost.videos && longestPost.videos.length > 0 && (
                  <div
                    className={styles.dynamicImages}
                    data-image-count={Math.min(longestPost.videos.length, 9)}
                    style={{ gap: "8px" }}
                  >
                    {longestPost.videos.slice(0, 9).map((video, vidIndex) => (
                      <div
                        key={vidIndex}
                        className={styles.imageWrapper}
                        onClick={() => {
                          setPreviewVideos(longestPost.videos);
                          setPreviewVideoIndex(vidIndex);
                        }}
                      >
                        <video
                          src={video.url}
                          className={styles.dynamicImage}
                          muted
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            e.target.currentTime = 0.1;
                          }}
                        />
                        <div className={styles.videoPlayIcon}>▶</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              <div className={styles.dynamicItem} style={{ padding: "16px", borderRadius: "8px" }}>
                <div className={styles.dynamicHeader}>
                  <span className={styles.dynamicDate}>
                    {formatDateTime(shortestPost.timestamp)}
                  </span>
                </div>
                <div className={styles.dynamicText}>
                  {shortestPost.text
                    .split("\n")
                    .map((paragraph, index) => (
                      <div key={index} className={styles.dynamicParagraph}>
                        {paragraph || "\u00A0"}
                      </div>
                    ))}
                </div>
                {shortestPost.images && shortestPost.images.length > 0 && (
                  <div
                    className={styles.dynamicImages}
                    data-image-count={Math.min(shortestPost.images.length, 9)}
                    style={{ gap: "8px" }}
                  >
                    {shortestPost.images.slice(0, 9).map((image, imgIndex) => {
                      const imageKey = `shortest-${shortestPost.timestamp}-${imgIndex}`;
                      const isHovered = hoveredImageIndex === imageKey;

                      const handleDownload = async (event) => {
                        event.stopPropagation();
                        try {
                          if (image.file && image.file instanceof File) {
                            const url = window.URL.createObjectURL(image.file);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download =
                              image.name ||
                              image.file.name ||
                              `image-${imgIndex + 1}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            return;
                          }

                          if (image.url && image.url.startsWith("data:")) {
                            const link = document.createElement("a");
                            link.href = image.url;
                            link.download =
                              image.name || `image-${imgIndex + 1}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            return;
                          }

                          const response = await fetch(image.url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download =
                            image.name || `image-${imgIndex + 1}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error("下载图片失败:", error);
                        }
                      };

                      return (
                        <div
                          key={imgIndex}
                          className={styles.imageWrapper}
                          onMouseEnter={() => setHoveredImageIndex(imageKey)}
                          onMouseLeave={() => setHoveredImageIndex(null)}
                          onClick={() => {
                            setPreviewImages(shortestPost.images);
                            setPreviewIndex(imgIndex);
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
                              onClick={handleDownload}
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
                {shortestPost.videos && shortestPost.videos.length > 0 && (
                  <div
                    className={styles.dynamicImages}
                    data-image-count={Math.min(shortestPost.videos.length, 9)}
                    style={{ gap: "8px" }}
                  >
                    {shortestPost.videos.slice(0, 9).map((video, vidIndex) => (
                      <div
                        key={vidIndex}
                        className={styles.imageWrapper}
                        onClick={() => {
                          setPreviewVideos(shortestPost.videos);
                          setPreviewVideoIndex(vidIndex);
                        }}
                      >
                        <video
                          src={video.url}
                          className={styles.dynamicImage}
                          muted
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            e.target.currentTime = 0.1;
                          }}
                        />
                        <div className={styles.videoPlayIcon}>▶</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
};

export default Chapter3;

