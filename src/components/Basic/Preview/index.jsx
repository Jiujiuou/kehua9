import {
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { FaPlus } from "react-icons/fa";
import { parseDynamicData } from "@/utils/parseData";
import PropTypes from "prop-types";
import ImagePreview from "@/components/Basic/ImagePreview";
import { useToastHelpers } from "@/components/Basic/Toast";
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
      contentTypeFilter = null,
      dynamics: externalDynamics = null,
      onDynamicsChange = null,
      onScrollChange = null,
      onDirectoryHandleChange = null,
    },
    ref
  ) => {
    const [dynamics, setDynamics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const fileInputRef = useRef(null);
    const contentAreaRef = useRef(null);
    const prevExternalDynamicsRef = useRef(null);
    const isInternalUpdateRef = useRef(false);
    const toast = useToastHelpers();

    // 当外部传入的 dynamics 变化时，同步更新内部 state
    useEffect(() => {
      // 只有当 externalDynamics 真正变化时才更新
      if (externalDynamics !== null && externalDynamics !== undefined) {
        // 使用 JSON.stringify 比较数组内容是否真的变化了
        const currentStr = JSON.stringify(externalDynamics);
        const prevStr = JSON.stringify(prevExternalDynamicsRef.current);
        
        if (currentStr !== prevStr) {
          prevExternalDynamicsRef.current = externalDynamics;
          isInternalUpdateRef.current = false; // 标记为外部更新
          setDynamics(externalDynamics);
        }
      } else if (externalDynamics === null && prevExternalDynamicsRef.current !== null) {
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

    // 根据筛选和排序配置对动态进行处理
    const sortedDynamics = useMemo(() => {
      // 先进行筛选
      let filtered = dynamics.filter((dynamic) => {
        const hasImages = dynamic.images && dynamic.images.length > 0;

        if (contentTypeFilter === null) {
          // 没有选择筛选条件，显示所有
          return true;
        } else if (contentTypeFilter === "textOnly") {
          // 只显示纯文字
          return !hasImages;
        } else if (contentTypeFilter === "withImages") {
          // 只显示含图片
          return hasImages;
        }
        return true;
      });

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
    }, [dynamics, sortOrder, contentTypeFilter]);

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
        event.target.value = '';
      }
    };

    const handleUploadClick = async () => {
      // 尝试使用 File System Access API（如果支持）
      if ('showDirectoryPicker' in window) {
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
          if (error.name !== 'AbortError') {
            console.error("选择文件夹失败:", error);
          }
        }
      } else {
        // 降级到传统的文件输入方式
        fileInputRef.current?.click();
      }
    };

    // 从 DirectoryHandle 递归获取所有文件
    const getFilesFromDirectoryHandle = async (directoryHandle, path = '') => {
      const files = [];
      for await (const [name, handle] of directoryHandle.entries()) {
        const currentPath = path ? `${path}/${name}` : name;
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          // 添加 webkitRelativePath 属性以保持兼容性
          Object.defineProperty(file, 'webkitRelativePath', {
            value: currentPath,
            writable: false,
          });
          files.push(file);
        } else if (handle.kind === 'directory') {
          const subFiles = await getFilesFromDirectoryHandle(handle, currentPath);
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
                        const isLastParagraph = paragraphIndex === array.length - 1;
                        return (
                          <div
                            key={paragraphIndex}
                            className={styles.dynamicParagraph}
                            style={{
                              textIndent: textIndent ? "2em" : "0",
                              fontSize: `${fontSize}px`,
                              fontWeight: fontWeight,
                              marginBottom:
                                paragraphSpacing && !isLastParagraph ? "1em" : "0.5em",
                            }}
                          >
                            {paragraph}
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
  contentTypeFilter: PropTypes.oneOf([null, "textOnly", "withImages"]),
  dynamics: PropTypes.array,
  onDynamicsChange: PropTypes.func,
  onScrollChange: PropTypes.func,
  onDirectoryHandleChange: PropTypes.func,
};

export default Preview;
