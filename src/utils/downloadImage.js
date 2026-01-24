import { toPng } from "html-to-image";
import download from "downloadjs";

/**
 * 下载元素为图片
 * @param {HTMLElement} element - 要下载的 DOM 元素
 * @param {Object} options - 配置选项
 * @param {string} options.filename - 下载的文件名（不含扩展名）
 * @param {HTMLElement} options.excludeElement - 下载时要隐藏的元素（如下载按钮）
 * @param {string} options.contentSelector - 内容区域的 CSS 选择器（用于处理滚动）
 * @param {string} options.backgroundColor - 背景颜色，默认为 "#fef9f0"
 * @param {number} options.scaleFactor - 缩放因子，默认为 2（提高清晰度）
 * @returns {Promise<void>}
 */
export const downloadElementAsImage = async ({
  element,
  filename = "image",
  excludeElement = null,
  contentSelector = null,
  backgroundColor = "#fef9f0",
  scaleFactor = 2,
}) => {
  if (!element) {
    console.error("下载失败: 元素不存在");
    return;
  }

  // 保存原始样式
  const originalStyles = {
    element: {
      maxHeight: element.style.maxHeight,
      overflow: element.style.overflow,
    },
  };

  // 临时隐藏排除的元素（如下载按钮）
  let excludeElementOriginalDisplay = "";
  if (excludeElement) {
    excludeElementOriginalDisplay = excludeElement.style.display;
    excludeElement.style.display = "none";
  }

  // 临时移除高度限制和滚动，确保完整内容被导出
  element.style.maxHeight = "none";
  element.style.overflow = "visible";

  // 保存所有滚动容器的原始样式，用于恢复
  const scrollContainers = [];

  // 处理指定的内容区域滚动
  if (contentSelector) {
    const contentElement = element.querySelector(contentSelector);
    if (contentElement) {
      scrollContainers.push({
        element: contentElement,
        originalStyles: {
          maxHeight: contentElement.style.maxHeight,
          overflow: contentElement.style.overflow,
          overflowY: contentElement.style.overflowY,
        },
      });
      contentElement.style.maxHeight = "none";
      contentElement.style.overflow = "visible";
      contentElement.style.overflowY = "visible";
    }
  }

  // 自动查找并处理所有有滚动的子元素（包括嵌套的滚动容器）
  const findAllScrollContainers = (parent) => {
    const containers = [];
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (node === element || node === excludeElement) continue;
      
      const computedStyle = window.getComputedStyle(node);
      const overflowY = computedStyle.overflowY;
      const maxHeight = computedStyle.maxHeight;
      
      // 如果元素有滚动或高度限制，需要处理
      if (
        (overflowY === "auto" || overflowY === "scroll") ||
        (maxHeight && maxHeight !== "none" && maxHeight !== "100%")
      ) {
        // 检查是否已经在 scrollContainers 中
        const alreadyAdded = scrollContainers.some((c) => c.element === node);
        if (!alreadyAdded) {
          containers.push({
            element: node,
            originalStyles: {
              maxHeight: node.style.maxHeight,
              overflow: node.style.overflow,
              overflowY: node.style.overflowY,
            },
          });
          node.style.maxHeight = "none";
          node.style.overflow = "visible";
          node.style.overflowY = "visible";
        }
      }
    }
    return containers;
  };

  // 查找所有滚动容器
  const allScrollContainers = findAllScrollContainers(element);
  scrollContainers.push(...allScrollContainers);

  // 等待 DOM 更新，并确保内容完全展开
  // 对于长内容，需要多次检查直到高度稳定
  let previousHeight = 0;
  let stableCount = 0;
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const currentHeight = element.scrollHeight;
    if (currentHeight === previousHeight) {
      stableCount++;
      if (stableCount >= 2) {
        // 高度连续两次相同，认为已稳定
        break;
      }
    } else {
      stableCount = 0;
    }
    previousHeight = currentHeight;
  }

  try {
    // 获取展开后的完整高度
    const fullHeight = element.scrollHeight;
    const width = element.offsetWidth;

    // 使用 html-to-image 的 toPng 方法导出高清图片
    const dataUrl = await toPng(element, {
      width: width,
      height: fullHeight,
      pixelRatio: scaleFactor,
      backgroundColor: backgroundColor,
      cacheBust: true,
      style: {
        margin: "0",
        padding: "0",
        maxHeight: "none",
        overflow: "visible",
      },
    });

    // 恢复原始样式
    element.style.maxHeight = originalStyles.element.maxHeight;
    element.style.overflow = originalStyles.element.overflow;

    // 恢复所有滚动容器的样式
    scrollContainers.forEach(({ element: container, originalStyles: styles }) => {
      container.style.maxHeight = styles.maxHeight;
      container.style.overflow = styles.overflow;
      container.style.overflowY = styles.overflowY;
    });

    // 恢复排除元素的显示
    if (excludeElement) {
      excludeElement.style.display = excludeElementOriginalDisplay;
    }

    // 使用 downloadjs 下载图片
    const finalFilename = filename.endsWith(".png")
      ? filename
      : `${filename}.png`;
    download(dataUrl, finalFilename);
  } catch (error) {
    console.error("下载图片失败:", error);

    // 确保在出错时也恢复样式
    element.style.maxHeight = originalStyles.element.maxHeight;
    element.style.overflow = originalStyles.element.overflow;

    // 恢复所有滚动容器的样式
    scrollContainers.forEach(({ element: container, originalStyles: styles }) => {
      container.style.maxHeight = styles.maxHeight;
      container.style.overflow = styles.overflow;
      container.style.overflowY = styles.overflowY;
    });

    if (excludeElement) {
      excludeElement.style.display = excludeElementOriginalDisplay;
    }

    throw error;
  }
};
