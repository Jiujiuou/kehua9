import {
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { HiOutlineEye } from "react-icons/hi";
import { parseDynamicData } from "@/utils/parseData";
import PropTypes from "prop-types";
import ImagePreview from "@/components/Basic/ImagePreview";
import VideoPreview from "@/components/Basic/VideoPreview";
import CardPreview from "@/components/Basic/CardPreview";
import { useToastHelpers } from "@/components/Basic/Toast";
import { useConfirmHelper } from "@/components/Basic/Confirm";
import { deleteDynamicFromFile } from "@/utils/writeData";
import { getFontFamily } from "@/utils/fonts";
import styles from "./index.module.less";

const Preview = forwardRef(
  (
    {
      sortOrder = "asc",
      imageGap = 4,
      previewPadding = 20,
      contentGap = 12,
      borderRadius = 8,
      textIndent = true,
      paragraphSpacing = false,
      fontSize = 15,
      fontWeight = 400,
      fontFamily = "system",
      lineHeight = 1.6,
      contentTypeFilter = null,
      dynamics: externalDynamics = null,
      onDynamicsChange = null,
      onScrollChange = null,
      onDirectoryHandleChange = null,
      directoryHandle = null,
    },
    ref
  ) => {
    const [dynamics, setDynamics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [previewVideos, setPreviewVideos] = useState([]);
    const [previewVideoIndex, setPreviewVideoIndex] = useState(0);
    const [cardPreviewDynamic, setCardPreviewDynamic] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const fileInputRef = useRef(null);
    const contentAreaRef = useRef(null);
    const prevExternalDynamicsRef = useRef(null);
    const isInternalUpdateRef = useRef(false);
    const toast = useToastHelpers();
    const confirm = useConfirmHelper();

    // 当外部传入的 dynamics 变化时，同步更新内部 state
    useEffect(() => {
      // 只有当 externalDynamics 真正变化时才更新
      if (externalDynamics !== null && externalDynamics !== undefined) {
        // 使用轻量级比较方法，避免 JSON.stringify 导致字符串过长错误
        const prev = prevExternalDynamicsRef.current;
        let hasChanged = false;

        // 如果引用相同，则内容相同
        if (prev === externalDynamics) {
          hasChanged = false;
        } else if (!prev || prev.length !== externalDynamics.length) {
          // 长度不同，肯定变化了
          hasChanged = true;
        } else {
          // 长度相同，比较关键字段（时间戳）来判断是否变化
          // 只比较第一条和最后一条的时间戳，以及总长度
          const prevFirst = prev[0]?.timestamp;
          const currentFirst = externalDynamics[0]?.timestamp;
          const prevLast = prev[prev.length - 1]?.timestamp;
          const currentLast =
            externalDynamics[externalDynamics.length - 1]?.timestamp;

          hasChanged = prevFirst !== currentFirst || prevLast !== currentLast;
        }

        if (hasChanged) {
          prevExternalDynamicsRef.current = externalDynamics;
          isInternalUpdateRef.current = false; // 标记为外部更新
          setDynamics(externalDynamics);
        }
      } else if (
        externalDynamics === null &&
        prevExternalDynamicsRef.current !== null
      ) {
        // 如果外部传入 null，且之前不是 null，则清空
        prevExternalDynamicsRef.current = null;
        isInternalUpdateRef.current = false;
        setDynamics([]);
      }
    }, [externalDynamics]);

    // 当动态数据变化时，通知父组件（但排除外部更新导致的内部变化）
    useEffect(() => {
      // 只有在内部更新时才通知父组件
      if (onDynamicsChange && isInternalUpdateRef.current) {
        onDynamicsChange(dynamics);
        isInternalUpdateRef.current = false; // 重置标志
      }
    }, [dynamics, onDynamicsChange]);

    // 监听滚动事件，检测当前可见的日期
    useEffect(() => {
      const contentElement = contentAreaRef.current;
      if (!contentElement || !onScrollChange) return;

      const handleScroll = () => {
        const scrollTop = contentElement.scrollTop;
        const containerRect = contentElement.getBoundingClientRect();
        const viewportTop = scrollTop;

        // 获取所有日期元素
        const dateElements = Array.from(
          contentElement.querySelectorAll("[data-date]")
        );

        // 找到当前视口中最接近顶部的日期元素
        let currentDate = null;
        let minDistance = Infinity;

        for (const element of dateElements) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top - containerRect.top + scrollTop;
          const elementBottom = elementTop + rect.height;

          // 如果元素在视口中可见
          if (
            elementTop <= scrollTop + containerRect.height &&
            elementBottom >= scrollTop
          ) {
            // 计算元素顶部到视口顶部的距离
            const distance = Math.abs(elementTop - viewportTop);

            // 选择距离视口顶部最近的元素
            if (distance < minDistance) {
              minDistance = distance;
              currentDate = element.getAttribute("data-date");
            }
          }
        }

        // 如果找到了日期，通知父组件
        if (currentDate && onScrollChange) {
          onScrollChange(currentDate);
        }
      };

      contentElement.addEventListener("scroll", handleScroll);
      // 初始检查一次
      handleScroll();

      return () => {
        contentElement.removeEventListener("scroll", handleScroll);
      };
    }, [dynamics, onScrollChange]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getContentElement: () => contentAreaRef.current,
      scrollToDate: (dateStr) => {
        if (!contentAreaRef.current) return;

        // 查找对应日期的第一个动态项
        const targetElement = contentAreaRef.current.querySelector(
          `[data-date="${dateStr}"]`
        );

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      },
    }));

    // 高亮关键词的函数
    const highlightKeyword = (text, keyword) => {
      if (!keyword || !text) return text;

      const regex = new RegExp(
        `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      const parts = text.split(regex);

      return parts.map((part, index) => {
        if (part.toLowerCase() === keyword.toLowerCase()) {
          return (
            <mark key={index} className={styles.highlight}>
              {part}
            </mark>
          );
        }
        return part;
      });
    };

    // 根据筛选和排序配置对动态进行处理
    const sortedDynamics = useMemo(() => {
      // 先进行筛选
      let filtered = dynamics.filter((dynamic) => {
        const hasImages = dynamic.images && dynamic.images.length > 0;
        const hasVideos = dynamic.videos && dynamic.videos.length > 0;
        const hasText = dynamic.text && dynamic.text.trim().length > 0;

        if (contentTypeFilter === null) {
          // 没有选择筛选条件，显示所有（有文字、图片或视频的都显示）
          return hasText || hasImages || hasVideos;
        } else if (contentTypeFilter === "textOnly") {
          // 只显示纯文字（没有图片和视频，但有文字内容）
          return !hasImages && !hasVideos && hasText;
        } else if (contentTypeFilter === "withImages") {
          // 只显示含图片（不含视频）
          return hasImages && !hasVideos;
        } else if (contentTypeFilter === "withVideos") {
          // 只显示含视频
          return hasVideos;
        }
        return true;
      });

      // 搜索过滤
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        filtered = filtered.filter((dynamic) => {
          // 搜索文本内容
          if (dynamic.text && dynamic.text.toLowerCase().includes(keyword)) {
            return true;
          }
          // 搜索图片名称
          if (
            dynamic.images &&
            dynamic.images.some(
              (img) => img.name && img.name.toLowerCase().includes(keyword)
            )
          ) {
            return true;
          }
          // 搜索视频名称
          if (
            dynamic.videos &&
            dynamic.videos.some(
              (vid) => vid.name && vid.name.toLowerCase().includes(keyword)
            )
          ) {
            return true;
          }
          return false;
        });
      }

      // 再进行排序
      if (sortOrder === "asc") {
        // 正序：从早到晚
        return filtered.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      } else {
        // 倒序：从晚到早
        return filtered.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      }
    }, [dynamics, sortOrder, contentTypeFilter, searchKeyword]);

    const handleFileSelect = async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      console.log("上传的文件数量:", files.length);
      // 打印前几个文件的路径，用于调试
      if (files.length > 0) {
        console.log("第一个文件路径:", files[0].webkitRelativePath);
        if (files.length > 1) {
          console.log("第二个文件路径:", files[1].webkitRelativePath);
        }
      }

      setIsLoading(true);
      try {
        const parsedData = await parseDynamicData(files);
        console.log("解析后的动态数量:", parsedData.length);
        console.log("解析后的数据:", parsedData);
        isInternalUpdateRef.current = true; // 标记为内部更新
        prevExternalDynamicsRef.current = parsedData; // 更新外部引用，避免重复更新
        setDynamics(parsedData);
        toast.success("数据加载成功");
      } catch (error) {
        console.error("解析数据失败:", error);
        console.error("错误堆栈:", error.stack);
        toast.error("解析数据失败，请检查文件格式");
      } finally {
        setIsLoading(false);
        // 清空 input 的值，以便可以重复选择同一个文件夹
        event.target.value = "";
      }
    };

    const handleUploadClick = async () => {
      // 尝试使用 File System Access API（如果支持）
      if ("showDirectoryPicker" in window) {
        try {
          const directoryHandle = await window.showDirectoryPicker();

          // 通知父组件保存文件夹句柄
          if (onDirectoryHandleChange) {
            onDirectoryHandleChange(directoryHandle);
          }

          // 从文件夹句柄获取所有文件
          const files = await getFilesFromDirectoryHandle(directoryHandle);
          if (files.length > 0) {
            await handleFiles(files);
          }
        } catch (error) {
          // 用户取消选择或其他错误
          if (error.name !== "AbortError") {
            console.error("选择文件夹失败:", error);
          }
        }
      } else {
        // 降级到传统的文件输入方式
        fileInputRef.current?.click();
      }
    };

    // 从 DirectoryHandle 递归获取所有文件
    const getFilesFromDirectoryHandle = async (directoryHandle, path = "") => {
      const files = [];
      for await (const [name, handle] of directoryHandle.entries()) {
        const currentPath = path ? `${path}/${name}` : name;
        if (handle.kind === "file") {
          const file = await handle.getFile();
          // 添加 webkitRelativePath 属性以保持兼容性
          Object.defineProperty(file, "webkitRelativePath", {
            value: currentPath,
            writable: false,
          });
          files.push(file);
        } else if (handle.kind === "directory") {
          const subFiles = await getFilesFromDirectoryHandle(
            handle,
            currentPath
          );
          files.push(...subFiles);
        }
      }
      return files;
    };

    // 处理文件列表
    const handleFiles = async (files) => {
      setIsLoading(true);
      try {
        const parsedData = await parseDynamicData(files);
        console.log("解析后的动态数量:", parsedData.length);
        console.log("解析后的数据:", parsedData);
        isInternalUpdateRef.current = true; // 标记为内部更新
        prevExternalDynamicsRef.current = parsedData; // 更新外部引用，避免重复更新
        setDynamics(parsedData);
        toast.success("数据加载成功");
      } catch (error) {
        console.error("解析数据失败:", error);
        console.error("错误堆栈:", error.stack);
        toast.error("解析数据失败，请检查文件格式");
      } finally {
        setIsLoading(false);
      }
    };

    // 如果没有数据，显示上传区域
    if (dynamics.length === 0 && !isLoading) {
      return (
        <div className={styles.preview}>
          <div className={styles.uploadArea} onClick={handleUploadClick}>
            <input
              ref={fileInputRef}
              type="file"
              webkitdirectory=""
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <div className={styles.uploadIcon}>
              <FaPlus />
            </div>
            <div className={styles.uploadText}>点击上传数据文件夹</div>
            <div className={styles.uploadHint}>请选择「我的动态」文件夹</div>
          </div>
        </div>
      );
    }

    // 加载中状态
    if (isLoading) {
      return (
        <div className={styles.preview}>
          <div className={styles.loadingArea}>
            <div className={styles.loadingText}>正在解析数据...</div>
          </div>
        </div>
      );
    }

    // 渲染动态内容
    return (
      <>
        <div className={styles.preview}>
          <div className={styles.searchBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="搜索动态..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchKeyword(searchInput.trim());
                }
              }}
            />
            <button
              className={styles.searchButton}
              onClick={() => setSearchKeyword(searchInput.trim())}
              title="搜索"
            >
              <FaSearch />
            </button>
          </div>
          <div
            className={styles.contentArea}
            ref={contentAreaRef}
            style={{ padding: `${previewPadding}px` }}
          >
            {sortedDynamics.map((dynamic, index) => (
              <div
                key={index}
                className={styles.dynamicItem}
                data-date={dynamic.date}
                style={{
                  padding: `${contentGap}px`,
                  borderRadius: `${borderRadius}px`,
                }}
              >
                <div className={styles.dynamicHeader}>
                  <span className={styles.dynamicDate}>
                    {dynamic.date} {dynamic.time}
                  </span>
                  <div className={styles.headerIcons}>
                    <HiOutlineEye
                      className={styles.previewIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCardPreviewDynamic(dynamic);
                      }}
                      title="卡片预览"
                    />
                    {(() => {
                      // 检查是否是2026年的动态
                      const year = new Date(dynamic.timestamp).getFullYear();
                      if (year === 2026 && directoryHandle) {
                        return (
                          <MdDeleteOutline
                            className={styles.deleteIcon}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const result = await confirm(
                                "确定要删除这条动态吗？"
                              );
                              if (result) {
                                try {
                                  const year = new Date(dynamic.timestamp)
                                    .getFullYear()
                                    .toString();
                                  await deleteDynamicFromFile(
                                    directoryHandle,
                                    year,
                                    dynamic.timestamp
                                  );
                                  // 从列表中移除
                                  const updatedDynamics = dynamics.filter(
                                    (d) => d.timestamp !== dynamic.timestamp
                                  );
                                  isInternalUpdateRef.current = true;
                                  prevExternalDynamicsRef.current =
                                    updatedDynamics;
                                  setDynamics(updatedDynamics);
                                  if (onDynamicsChange) {
                                    onDynamicsChange(updatedDynamics);
                                  }
                                  toast.success("删除成功");
                                } catch (error) {
                                  console.error("删除失败:", error);
                                  toast.error("删除失败：" + error.message);
                                }
                              }
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                {dynamic.text && (
                  <div className={styles.dynamicText}>
                    {dynamic.text
                      .split("\n")
                      .map((paragraph, paragraphIndex, array) => {
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
                        const isLastParagraph =
                          paragraphIndex === array.length - 1;
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
                              ? highlightKeyword(
                                  paragraph,
                                  searchKeyword.trim()
                                )
                              : paragraph}
                          </div>
                        );
                      })}
                  </div>
                )}
                {dynamic.images.length > 0 && (
                  <div
                    className={styles.dynamicImages}
                    data-image-count={Math.min(dynamic.images.length, 9)}
                    style={{ gap: `${imageGap}px` }}
                  >
                    {dynamic.images.slice(0, 9).map((image, imgIndex) => (
                      <div
                        key={imgIndex}
                        className={styles.imageWrapper}
                        onClick={() => {
                          setPreviewImages(dynamic.images);
                          setPreviewIndex(imgIndex);
                        }}
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className={styles.dynamicImage}
                        />
                      </div>
                    ))}
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
                          setPreviewVideos(dynamic.videos);
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
            ))}
          </div>
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
        <CardPreview
          dynamic={cardPreviewDynamic}
          onClose={() => {
            setCardPreviewDynamic(null);
          }}
        />
      </>
    );
  }
);

Preview.displayName = "Preview";

Preview.propTypes = {
  sortOrder: PropTypes.oneOf(["asc", "desc"]),
  imageGap: PropTypes.number,
  previewPadding: PropTypes.number,
  contentGap: PropTypes.number,
  borderRadius: PropTypes.number,
  textIndent: PropTypes.bool,
  paragraphSpacing: PropTypes.bool,
  fontSize: PropTypes.number,
  fontWeight: PropTypes.number,
  fontFamily: PropTypes.string,
  lineHeight: PropTypes.oneOf([1.4, 1.5, 1.6, 1.8, 2.0]),
  contentTypeFilter: PropTypes.oneOf([
    null,
    "textOnly",
    "withImages",
    "withVideos",
  ]),
  dynamics: PropTypes.array,
  onDynamicsChange: PropTypes.func,
  onScrollChange: PropTypes.func,
  onDirectoryHandleChange: PropTypes.func,
  directoryHandle: PropTypes.object,
};

export default Preview;
