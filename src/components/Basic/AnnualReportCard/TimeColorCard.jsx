import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./Chapter4.module.less";

const TimeColorCard = ({ colorData, index, onCardClick }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const glowPhaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colorData) {
      console.log("[TimeColorCard] Canvas 或 colorData 不存在", { canvas: !!canvas, colorData: !!colorData });
      return;
    }

    // 等待 DOM 渲染完成
    const initCanvas = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("[TimeColorCard] 无法获取 Canvas 2D 上下文");
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // 如果尺寸为0，使用默认尺寸
      const defaultWidth = 120;
      const defaultHeight = 160;
      const width = rect.width > 0 ? rect.width : defaultWidth;
      const height = rect.height > 0 ? rect.height : defaultHeight;

      console.log(`[TimeColorCard] Canvas 尺寸: ${width}x${height}`, { rectWidth: rect.width, rectHeight: rect.height });

      // 设置实际渲染尺寸
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // 设置显示尺寸
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // 缩放上下文
      ctx.scale(dpr, dpr);

      const borderRadius = 12;

    // 圆角矩形路径函数
    const roundRect = (ctx, x, y, width, height, radius) => {
      if (radius > width / 2) radius = width / 2;
      if (radius > height / 2) radius = height / 2;

      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    };

    // 绘制函数
    const draw = (glowPhase = 0) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // 创建圆角矩形路径
      ctx.beginPath();
      roundRect(ctx, 0, 0, width, height, borderRadius);
      ctx.closePath();

      // 绘制阴影
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // 绘制背景渐变
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      bgGradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");

      ctx.fillStyle = bgGradient;
      ctx.fill();

      // 绘制年份标签背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, width, 30);

      // 绘制年份文字
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillText(colorData.year, width / 2, 15);

      // 绘制色彩样本
      const sampleHeight = height - 50;
      const centerX = width / 2;
      const centerY = 30 + sampleHeight / 2;
      const radius = Math.min(width, sampleHeight) * 0.4;

      // 创建径向渐变
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      const visualConfig = colorData.visualConfig;
      if (visualConfig?.gradient?.stops) {
        visualConfig.gradient.stops.forEach((stop) => {
          gradient.addColorStop(stop.position, stop.color);
        });
      } else {
        gradient.addColorStop(0, colorData.variants.light);
        gradient.addColorStop(0.5, colorData.baseColor.hex);
        gradient.addColorStop(1, colorData.variants.dark);
      }

      // 绘制色彩样本
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fill();

      // 绘制呼吸动画效果
      if (glowPhase > 0) {
        const breathIntensity = Math.sin(glowPhase * Math.PI * 2) * 0.2 + 0.8;
        const ringRadius = radius * (1 + breathIntensity * 0.1);
        const ringWidth = 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = colorData.variants.light;
        ctx.lineWidth = ringWidth;
        ctx.globalAlpha = 0.3 * breathIntensity;
        ctx.stroke();

        // 内发光
        const innerGlowRadius = radius * 0.9;
        const innerGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerGlowRadius * 0.5,
          centerX,
          centerY,
          innerGlowRadius
        );

        innerGradient.addColorStop(0, colorData.variants.light + "4D");
        innerGradient.addColorStop(1, colorData.variants.light + "00");

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerGlowRadius, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 绘制描边
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    };

      // 初始绘制
      draw();

      // 动画循环
      const animate = () => {
        glowPhaseRef.current += 0.01;
        if (glowPhaseRef.current > 1) glowPhaseRef.current = 0;
        draw(glowPhaseRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      // 延迟启动动画
      const timer = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
      }, index * 100 + 500);

      // 返回清理函数
      return () => {
        clearTimeout(timer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    };

    // 使用 requestAnimationFrame 确保 DOM 已渲染
    let cleanupFn = null;
    let rafId = requestAnimationFrame(() => {
      // 再次检查，确保尺寸已确定
      const checkSize = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // 如果尺寸仍为0，再等一帧（最多等待10次）
          let retryCount = 0;
          const retry = () => {
            retryCount++;
            const newRect = canvas.getBoundingClientRect();
            if ((newRect.width > 0 && newRect.height > 0) || retryCount >= 10) {
              cleanupFn = initCanvas();
            } else {
              requestAnimationFrame(retry);
            }
          };
          requestAnimationFrame(retry);
        } else {
          cleanupFn = initCanvas();
        }
      };
      checkSize();
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (cleanupFn) {
        cleanupFn();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [colorData, index]);

  if (!colorData) return null;

  return (
    <div
      className={styles.colorCardContainer}
      onClick={() => onCardClick && onCardClick(colorData)}
    >
      <canvas ref={canvasRef} className={styles.colorCardCanvas} />
      <div className={styles.colorCardName}>{colorData.baseColor.name}</div>
    </div>
  );
};

TimeColorCard.propTypes = {
  colorData: PropTypes.object,
  index: PropTypes.number,
  onCardClick: PropTypes.func,
};

export default TimeColorCard;

