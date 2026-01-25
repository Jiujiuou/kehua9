import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_END_DATE } from "@/constant/annualReport";
import {
  calculateInclusiveDays,
  formatChineseDate,
  getDateStringFromDynamic,
} from "@/utils/annualReport";
import styles from "./FinalChapter.module.less";

// Canvas 辅助函数
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawPerforatedEdge = (ctx, x, y, height) => {
  const holeRadius = 2.5;
  const holeSpacing = 7;
  const numHoles = Math.floor(height / holeSpacing);
  const startY = y + (height - (numHoles - 1) * holeSpacing) / 2;

  ctx.save();
  // 绘制穿孔（小圆点）- 形成可撕开的视觉效果
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; // 使用深色填充，形成穿孔效果
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 0.5;

  for (let i = 0; i < numHoles; i++) {
    const holeY = startY + i * holeSpacing;
    ctx.beginPath();
    ctx.arc(x, holeY, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};

const drawAirplane = (ctx, x, y, size) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(235, 66, 95, 0.9)";
  ctx.strokeStyle = "rgba(235, 66, 95, 0.9)";
  ctx.lineWidth = 2;

  // 绘制飞机图标
  ctx.beginPath();
  // 机身
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(size * 0.8, 0);
  // 机翼
  ctx.moveTo(0, -size * 0.3);
  ctx.lineTo(size * 0.4, 0);
  ctx.lineTo(0, size * 0.3);
  // 尾翼
  ctx.moveTo(-size * 0.6, -size * 0.2);
  ctx.lineTo(-size * 0.8, 0);
  ctx.lineTo(-size * 0.6, size * 0.2);
  ctx.stroke();

  // 机头
  ctx.beginPath();
  ctx.arc(size * 0.7, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

/**
 * 机票样式时间线组件
 */
const TicketTimelineCanvas = ({
  startDateStr,
  endDateStr,
  startLabel,
  endLabel,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const drawTicket = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const maxWidth = rect.width;
    const height = 120;

    // 计算实际宽度（不超过父元素）
    const padding = 16;
    const availableWidth = maxWidth - padding * 2;

    // 测量文本宽度
    ctx.font =
      "400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const startLabelWidth = ctx.measureText(startLabel).width;
    const endLabelWidth = ctx.measureText(endLabel).width;

    ctx.font =
      "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const startDateWidth = ctx.measureText(startDateStr).width;
    const endDateWidth = ctx.measureText(endDateStr).width;

    const sidePadding = 20;
    const centerGap = 40;
    const leftSectionWidth = Math.max(startLabelWidth, startDateWidth) + sidePadding * 2;
    const rightSectionWidth = Math.max(endLabelWidth, endDateWidth) + sidePadding * 2;
    const totalWidth = leftSectionWidth + centerGap + rightSectionWidth;

    const width = Math.min(totalWidth, availableWidth);
    const scale = width / totalWidth;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 主题色配置
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-color")
      .trim() || "#eb425f";
    const colors = {
      ticketBg: "rgba(255, 255, 255, 0.08)",
      ticketBorder: `rgba(235, 66, 95, 0.3)`,
      accent: accentColor,
      accentLight: `rgba(235, 66, 95, 0.15)`,
      text: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.7)",
    };

    const centerY = height / 2;
    const leftSectionWidthScaled = leftSectionWidth * scale;
    const rightSectionWidthScaled = rightSectionWidth * scale;
    const centerGapScaled = centerGap * scale;
    const ticketRadius = 8;

    // 绘制左侧机票区域
    ctx.save();
    ctx.fillStyle = colors.ticketBg;
    ctx.strokeStyle = colors.ticketBorder;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 0, 0, leftSectionWidthScaled, height, ticketRadius);
    ctx.fill();
    ctx.stroke();

    // 绘制左侧穿孔边缘（右侧边缘）
    drawPerforatedEdge(ctx, leftSectionWidthScaled, 0, height);

    // 绘制左侧文本
    ctx.fillStyle = colors.textSecondary;
    ctx.font =
      "400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(startLabel, leftSectionWidthScaled / 2, centerY - 12);

    ctx.fillStyle = colors.text;
    ctx.font =
      "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(startDateStr, leftSectionWidthScaled / 2, centerY + 12);
    ctx.restore();

    // 绘制右侧机票区域
    const rightX = leftSectionWidthScaled + centerGapScaled;
    ctx.save();
    ctx.fillStyle = colors.ticketBg;
    ctx.strokeStyle = colors.ticketBorder;
    ctx.lineWidth = 1.5;
    drawRoundedRect(
      ctx,
      rightX,
      0,
      rightSectionWidthScaled,
      height,
      ticketRadius,
    );
    ctx.fill();
    ctx.stroke();

    // 绘制右侧穿孔边缘（左侧边缘）
    drawPerforatedEdge(ctx, rightX, 0, height);

    // 绘制右侧文本
    ctx.fillStyle = colors.textSecondary;
    ctx.font =
      "400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(endLabel, rightX + rightSectionWidthScaled / 2, centerY - 12);

    ctx.fillStyle = colors.text;
    ctx.font =
      "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(endDateStr, rightX + rightSectionWidthScaled / 2, centerY + 12);
    ctx.restore();

    // 绘制中间的连接线和飞机
    const lineStartX = leftSectionWidthScaled;
    const lineEndX = rightX;
    const lineY = centerY;

    // 绘制虚线连接线
    ctx.save();
    ctx.strokeStyle = colors.accentLight;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();
    ctx.restore();

    // 绘制飞机图标（在中间位置）
    const airplaneX = (lineStartX + lineEndX) / 2;
    drawAirplane(ctx, airplaneX, lineY, 12);
  }, [startDateStr, endDateStr, startLabel, endLabel]);

  useEffect(() => {
    drawTicket();

    // 监听窗口大小变化
    const handleResize = () => {
      drawTicket();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawTicket]);

  return (
    <div ref={containerRef} className={styles.ticketCanvasContainer}>
      <canvas ref={canvasRef} className={styles.ticketCanvas} />
    </div>
  );
};

TicketTimelineCanvas.propTypes = {
  startDateStr: PropTypes.string,
  endDateStr: PropTypes.string,
  startLabel: PropTypes.string,
  endLabel: PropTypes.string,
};

/**
 * FinalChapter：结尾页
 * - 内容参考结尾页文案与结构，实现完全在 src 内
 * - 始终使用"所有年份"的全量 dynamics 来生成首条动态日期与相伴天数
 */
const FinalChapter = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const [showDays, setShowDays] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showFarewell1, setShowFarewell1] = useState(false);
  const [showDivider, setShowDivider] = useState(false);
  const [showFarewell2, setShowFarewell2] = useState(false);
  const [showFarewell2Typing, setShowFarewell2Typing] = useState(false);
  const [displayedFarewell2Text, setDisplayedFarewell2Text] = useState("");

  const SUBTITLE_TEXT = "感谢你，让这些瞬间有了意义";
  const FAREWELL2_TEXT = "相信有一天可话会回来的\n在此之前，请你务必照顾好自己";

  const { firstDynamicDateStr, daysUntilEnd, endDateStr } = useMemo(() => {
    const endDateStr = ANNUAL_REPORT_END_DATE;

    // 找到最早的一条动态日期
    let first = null;
    (Array.isArray(dynamics) ? dynamics : []).forEach((d) => {
      const ds = getDateStringFromDynamic(d);
      if (!ds) return;
      if (!first || ds < first) first = ds;
    });

    const firstDynamicDateStr = first;
    const daysUntilEnd = firstDynamicDateStr
      ? calculateInclusiveDays(firstDynamicDateStr, endDateStr)
      : 0;

    return { firstDynamicDateStr, daysUntilEnd, endDateStr };
  }, [dynamics]);

  // 延迟函数
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    let typingTimer = null;
    let farewell2TypingTimer = null;

    const animateSequence = async () => {
      // 1. 显示标题
      await delay(300);
      setShowTitle(true);

      // 2. 打字机效果
      await delay(800);
      setShowSubtitle(true);

      let currentIndex = 0;
      const typingSpeed = 100; // 与其他页面保持一致

      const typeText = () => {
        if (currentIndex < SUBTITLE_TEXT.length) {
          setDisplayedSubtitle(SUBTITLE_TEXT.slice(0, currentIndex + 1));
          currentIndex++;
          typingTimer = setTimeout(typeText, typingSpeed);
        } else {
          // 打字机完成后，开始逐段显示内容
          setTimeout(async () => {
            // 3. 显示时间线
            await delay(500);
            setShowTimeline(true);

            // 4. 显示天数
            await delay(1000);
            setShowDays(true);

            // 5. 显示主要信息
            await delay(1000);
            setShowMessage(true);

            // 6. 显示第一段告别
            await delay(1000);
            setShowFarewell1(true);

            // 7. 显示分隔线
            await delay(400);
            setShowDivider(true);

            // 8. 显示第二段告别的打字机效果
            await delay(1000);
            setShowFarewell2Typing(true);

            let farewell2Index = 0;
            const farewell2TypingSpeed = 160; // 慢2倍

            const typeFarewell2Text = () => {
              if (farewell2Index < FAREWELL2_TEXT.length) {
                setDisplayedFarewell2Text(
                  FAREWELL2_TEXT.slice(0, farewell2Index + 1),
                );
                farewell2Index++;
                farewell2TypingTimer = setTimeout(
                  typeFarewell2Text,
                  farewell2TypingSpeed,
                );
              } else {
                // 打字机完成后，显示完整文字
                setShowFarewell2(true);
              }
            };

            typeFarewell2Text();
          }, 1000);
        }
      };

      typeText();
    };

    animateSequence();

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
      if (farewell2TypingTimer) clearTimeout(farewell2TypingTimer);
    };
  }, []);

  return (
    <div className={styles.finalContent}>
      <div
        className={`${styles.finalTitle} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        旅程的终点
      </div>

      {showTitle && (
        <div
          className={`${styles.finalSubtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          {displayedSubtitle}
          {displayedSubtitle.length < SUBTITLE_TEXT.length && (
            <span className={styles.cursor}>|</span>
          )}
        </div>
      )}

      <div className={styles.mainMessage}>
        <div
          className={`${styles.timelineBox} ${
            showTimeline ? styles.fadeIn : styles.hidden
          }`}
        >
          <TicketTimelineCanvas
            startDateStr={
              firstDynamicDateStr
                ? formatChineseDate(firstDynamicDateStr)
                : "—"
            }
            endDateStr={formatChineseDate(endDateStr)}
            startLabel="第一条动态"
            endLabel="相伴至今"
          />
        </div>

        <div
          className={`${styles.daysBox} ${showDays ? styles.fadeIn : styles.hidden}`}
        >
          <div className={styles.daysValue}>{daysUntilEnd}</div>
          <div className={styles.daysLabel}>天的美好时光</div>
        </div>

        <div
          className={`${styles.message} ${showMessage ? styles.fadeIn : styles.hidden}`}
        >
          <p>这些文字，这些画面，这些瞬间</p>
          <p>都是你走过的路</p>
          <p className={styles.highlight}>可话陪你记录了这一切</p>
        </div>

        <div
          className={`${styles.farewell} ${showFarewell1 ? styles.fadeIn : styles.hidden}`}
        >
          <p>虽然旅程即将告一段落</p>
          <p>但这些回忆会一直陪伴着你</p>
        </div>

        <div
          className={`${styles.divider} ${showDivider ? styles.fadeIn : styles.hidden}`}
        />

        <div
          className={`${styles.farewell} ${styles.sparkleText} ${
            showFarewell2Typing || showFarewell2 ? styles.fadeIn : styles.hidden
          }`}
        >
          {displayedFarewell2Text.split("\n").map((line, index, arr) => (
            <p key={index}>
              {line}
              {index === arr.length - 1 &&
                displayedFarewell2Text.length < FAREWELL2_TEXT.length && (
                  <span className={styles.cursor}>|</span>
                )}
            </p>
          ))}
          <span className={styles.sparkleDot1} />
          <span className={styles.sparkleDot2} />
          <span className={styles.sparkleDot3} />
          <span className={styles.sparkleDot4} />
        </div>
      </div>
    </div>
  );
};

FinalChapter.propTypes = {
  dynamics: PropTypes.array,
};

export default FinalChapter;
