import { useState, useEffect } from "react";

/**
 * 计算提示文本的显示位置
 * @param {React.RefObject} ref - 元素引用
 * @param {string} tips - 提示文本
 * @returns {string} 提示位置：'Top' | 'Bottom' | 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight'
 */
export function useTipsPosition(ref, tips) {
  const [position, setPosition] = useState("Top");

  useEffect(() => {
    if (!ref.current || !tips) {
      return;
    }

    const updatePosition = () => {
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // 如果元素在视口上半部分，提示显示在下方
      if (rect.top < viewportHeight / 2) {
        // 检查左右空间
        if (rect.left < viewportWidth / 3) {
          setPosition("BottomLeft");
        } else if (rect.right > (viewportWidth * 2) / 3) {
          setPosition("BottomRight");
        } else {
          setPosition("Bottom");
        }
      } else {
        // 元素在视口下半部分，提示显示在上方
        if (rect.left < viewportWidth / 3) {
          setPosition("TopLeft");
        } else if (rect.right > (viewportWidth * 2) / 3) {
          setPosition("TopRight");
        } else {
          setPosition("Top");
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [ref, tips]);

  return position;
}

