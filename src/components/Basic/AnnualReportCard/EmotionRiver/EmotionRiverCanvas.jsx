import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  generateRiverCurvePoints,
  generateBezierControlPoints,
  detectEmotionPeaks,
  formatDateLabel,
  adjustColorOpacity
} from './utils';
import { EMOTION_CATEGORIES } from '@/constant';
import styles from './EmotionRiver.module.less';

const EmotionRiverCanvas = forwardRef(({ 
  data = [], 
  width = 800, 
  height = 400,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  riverWidth = 40,
  showGrid = true,
  showPoints = true,
  showLabels = true,
  animationDuration = 2000,
  onPointClick
}, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    points: [],
    controlPoints: [],
    hoveredPoint: null,
    selectedPoint: null,
    animationProgress: 0,
    isAnimating: false,
    wavePhase: 0,
    ripples: []
  });

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    render: () => render(),
    animateRiverFlow: () => animateRiverFlow(),
    setHoveredPoint: (point) => {
      stateRef.current.hoveredPoint = point;
      render();
    },
    setSelectedPoint: (point) => {
      stateRef.current.selectedPoint = point;
      render();
    }
  }));

  // 初始化Canvas和数据渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 设置Canvas尺寸
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 如果已有数据，立即渲染
    if (data && data.length > 0) {
      const points = generateRiverCurvePoints(data, width, height, margin);
      const controlPoints = generateBezierControlPoints(points);
      detectEmotionPeaks(points);
      
      stateRef.current.points = points;
      stateRef.current.controlPoints = controlPoints;
      
      render();
    }
  }, [width, height]);

  // 数据变化时重新生成点
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (data && data.length > 0) {
      const points = generateRiverCurvePoints(data, width, height, margin);
      
      if (points.length === 0) {
        console.warn('[EmotionRiverCanvas] 没有生成任何点，数据:', data);
        return;
      }
      
      const controlPoints = generateBezierControlPoints(points);
      detectEmotionPeaks(points);
      
      stateRef.current.points = points;
      stateRef.current.controlPoints = controlPoints;
      
      // 确保Canvas尺寸正确
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      render();
    }
  }, [data, width, height, margin]);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { points, controlPoints, hoveredPoint, selectedPoint, ripples } = stateRef.current;
    
    // 获取实际的canvas尺寸（考虑DPI缩放）
    const dpr = window.devicePixelRatio || 1;
    const actualWidth = width;
    const actualHeight = height;
    
    // 清空画布（使用实际尺寸）
    ctx.clearRect(0, 0, actualWidth, actualHeight);
    
    // 绘制背景
    ctx.fillStyle = 'rgba(25, 25, 35, 0.3)';
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    
    // 绘制网格和坐标轴
    if (showGrid) {
      drawGridAndAxes(ctx);
    }
    
    // 绘制河流
    if (points && points.length >= 2 && controlPoints && controlPoints.length > 0) {
      drawRiver(ctx, points, controlPoints);
    }
    
    // 绘制数据点
    if (showPoints && points && points.length > 0) {
      drawDataPoints(ctx, points, hoveredPoint, selectedPoint);
    }
    
    // 绘制涟漪效果
    if (ripples && ripples.length > 0) {
      drawRipples(ctx, ripples);
    }
  };

  const drawGridAndAxes = (ctx) => {
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // 垂直网格线
    const verticalLines = 12;
    for (let i = 0; i <= verticalLines; i++) {
      const x = margin.left + (i / verticalLines) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    }
    
    // 水平网格线
    const horizontalLines = 6;
    for (let i = 0; i <= horizontalLines; i++) {
      const y = margin.top + (i / horizontalLines) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    
    // 坐标轴
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();
    
    // 时间标签
    if (showLabels && data.length > 0) {
      drawTimeLabels(ctx);
    }
    
    // 情感值标签
    if (showLabels) {
      drawEmotionLabels(ctx);
    }
  };

  const drawTimeLabels = (ctx) => {
    const { points } = stateRef.current;
    if (points.length === 0) return;
    
    const startDate = new Date(data[0].date);
    const endDate = new Date(data[data.length - 1].date);
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    
    let interval;
    if (totalDays <= 30) {
      interval = 7;
    } else if (totalDays <= 365) {
      interval = 30;
    } else {
      interval = 90;
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i < points.length; i += interval) {
      const point = points[i];
      if (!point) continue;
      
      const date = new Date(data[i].date);
      const label = formatDateLabel(date, totalDays);
      
      ctx.fillText(label, point.x, height - margin.bottom + 10);
      
      // 绘制刻度线
      ctx.beginPath();
      ctx.moveTo(point.x, height - margin.bottom);
      ctx.lineTo(point.x, height - margin.bottom + 5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const drawEmotionLabels = (ctx) => {
    const plotHeight = height - margin.top - margin.bottom;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const labels = [
      { value: 1, label: '积极' },
      { value: 0.5, label: '温暖' },
      { value: 0, label: '平静' },
      { value: -0.5, label: '沉思' },
      { value: -1, label: '深刻' }
    ];
    
    labels.forEach(item => {
      const y = margin.top + plotHeight / 2 - item.value * (plotHeight / 2);
      
      ctx.fillText(item.label, margin.left - 10, y);
      
      // 绘制水平刻度线
      ctx.beginPath();
      ctx.moveTo(margin.left - 5, y);
      ctx.lineTo(margin.left, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  const drawRiver = (ctx, points, controlPoints) => {
    if (!points || points.length === 0 || !controlPoints || controlPoints.length === 0) {
      return;
    }
    
    ctx.save();
    
    // 创建河流渐变
    const gradient = createRiverGradient(ctx);
    
    // 绘制河流路径（带波浪效果）
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // 使用贝塞尔曲线绘制，并添加轻微的波浪效果
    controlPoints.forEach((segment) => {
      const { wavePhase } = stateRef.current;
      const waveAmplitude = 2;
      const waveFrequency = 0.01;
      
      // 对控制点添加轻微的波浪偏移
      const midX = (segment.start.x + segment.end.x) / 2;
      const waveOffset = Math.sin((midX * waveFrequency) + wavePhase) * waveAmplitude;
      
      ctx.bezierCurveTo(
        segment.cp1.x, segment.cp1.y + waveOffset * 0.5,
        segment.cp2.x, segment.cp2.y + waveOffset * 0.5,
        segment.end.x, segment.end.y
      );
    });
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = riverWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // 添加内部渐变填充
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
    fillGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    fillGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    fillGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = fillGradient;
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
  };

  const createRiverGradient = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    
    if (data && data.length > 0) {
      const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
      
      if (avgValue > 0.5) {
        gradient.addColorStop(0, 'rgba(255, 183, 77, 0.6)');
        gradient.addColorStop(0.5, 'rgba(129, 199, 132, 0.6)');
        gradient.addColorStop(1, 'rgba(79, 195, 247, 0.6)');
      } else if (avgValue < -0.5) {
        gradient.addColorStop(0, 'rgba(149, 117, 205, 0.6)');
        gradient.addColorStop(0.5, 'rgba(121, 134, 203, 0.6)');
        gradient.addColorStop(1, 'rgba(79, 195, 247, 0.6)');
      } else {
        gradient.addColorStop(0, 'rgba(161, 136, 127, 0.6)');
        gradient.addColorStop(0.5, 'rgba(129, 199, 132, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 183, 77, 0.6)');
      }
    } else {
      gradient.addColorStop(0, 'rgba(79, 195, 247, 0.6)');
      gradient.addColorStop(0.5, 'rgba(129, 199, 132, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 183, 77, 0.6)');
    }
    
    return gradient;
  };


  const drawDataPoints = (ctx, points, hoveredPoint, selectedPoint) => {
    points.forEach(point => {
      if (!point.isDataPoint) return;
      
      ctx.save();
      
      let pointColor = point.color;
      let pointSize = point.size;
      let pointOpacity = point.opacity;
      
      if (hoveredPoint === point) {
        pointSize *= 1.5;
        pointOpacity = 1;
      } else if (selectedPoint === point) {
        pointSize *= 1.3;
        pointOpacity = 0.9;
      }
      
      // 绘制点
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
      
      ctx.fillStyle = adjustColorOpacity(pointColor, pointOpacity);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 如果是峰值点，添加特殊效果
      if (point.isSignificant) {
        drawPeakEffect(ctx, point);
      }
      
      // 如果是转折点，添加标记
      if (point.isTurningPoint) {
        drawTurningPointMarker(ctx, point);
      }
      
      ctx.restore();
    });
  };

  const drawPeakEffect = (ctx, point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.size * 2.5, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(
      point.x, point.y, point.size * 1.5,
      point.x, point.y, point.size * 2.5
    );
    
    gradient.addColorStop(0, adjustColorOpacity(point.color, 0.3));
    gradient.addColorStop(1, adjustColorOpacity(point.color, 0));
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制峰值标签
    if (point.significanceLabel) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      ctx.fillText(point.significanceLabel, point.x, point.y - point.size * 3);
    }
  };

  const drawTurningPointMarker = (ctx, point) => {
    const markerSize = point.size * 1.8;
    const arrowSize = markerSize * 0.6;
    
    ctx.save();
    ctx.translate(point.x, point.y);
    
    if (point.turningDirection === 'down') {
      ctx.rotate(Math.PI);
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -markerSize);
    ctx.lineTo(-arrowSize, -markerSize + arrowSize);
    ctx.lineTo(arrowSize, -markerSize + arrowSize);
    ctx.closePath();
    
    ctx.fillStyle = point.turningDirection === 'up' ? 
      'rgba(76, 175, 80, 0.9)' : 
      'rgba(244, 67, 54, 0.9)';
    
    ctx.fill();
    ctx.restore();
  };

  const drawRipples = (ctx, ripples) => {
    ripples.forEach(ripple => {
      if (!ripple.isActive) return;
      
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = adjustColorOpacity(ripple.color, ripple.opacity);
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hoveredPoint = findNearestPoint(x, y, 20);
    
    if (hoveredPoint !== stateRef.current.hoveredPoint) {
      stateRef.current.hoveredPoint = hoveredPoint;
      render();
      
      if (hoveredPoint) {
        showTooltip(hoveredPoint, x, y);
      } else {
        hideTooltip();
      }
    }
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedPoint = findNearestPoint(x, y, 15);
    
    if (clickedPoint) {
      stateRef.current.selectedPoint = clickedPoint;
      render();
      
      if (onPointClick) {
        onPointClick(clickedPoint);
      }
      
      createRippleEffect(clickedPoint.x, clickedPoint.y, clickedPoint.color);
    } else {
      if (stateRef.current.selectedPoint) {
        stateRef.current.selectedPoint = null;
        render();
      }
    }
  };

  const handleMouseLeave = () => {
    stateRef.current.hoveredPoint = null;
    hideTooltip();
    render();
  };

  const findNearestPoint = (x, y, radius) => {
    const { points } = stateRef.current;
    
    let nearestPoint = null;
    let minDistance = radius;
    
    for (const point of points) {
      if (!point.isDataPoint) continue;
      
      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }
    
    return nearestPoint;
  };

  const showTooltip = (point, x, y) => {
    let tooltip = document.getElementById('emotion-river-tooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'emotion-river-tooltip';
      tooltip.className = styles.tooltip;
      document.body.appendChild(tooltip);
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const tooltipX = rect.left + x + 15;
    const tooltipY = rect.top + y - 30;
    
    const date = new Date(point.date);
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    let emotionText = '';
    if (point.data && point.data.emotionId) {
      const emotionInfo = EMOTION_CATEGORIES[point.data.emotionId];
      emotionText = emotionInfo ? emotionInfo.name : '未知';
    }
    
    tooltip.innerHTML = `
      <div class="${styles.tooltipDate}">${formattedDate}</div>
      <div class="${styles.tooltipEmotion}">${emotionText}</div>
      ${point.data && point.data.postCount ? 
        `<div class="${styles.tooltipCount}">${point.data.postCount}条动态</div>` : ''}
    `;
    
    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
    tooltip.style.opacity = '1';
  };

  const hideTooltip = () => {
    const tooltip = document.getElementById('emotion-river-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  };

  const createRippleEffect = (x, y, color) => {
    const ripple = {
      x,
      y,
      radius: 0,
      maxRadius: 50,
      opacity: 0.7,
      color,
      isActive: true
    };
    
    stateRef.current.ripples = stateRef.current.ripples || [];
    stateRef.current.ripples.push(ripple);
    
    const animateRipple = () => {
      if (!ripple.isActive) return;
      
      ripple.radius += 2;
      ripple.opacity -= 0.02;
      
      if (ripple.radius >= ripple.maxRadius || ripple.opacity <= 0) {
        ripple.isActive = false;
        const index = stateRef.current.ripples.indexOf(ripple);
        if (index > -1) {
          stateRef.current.ripples.splice(index, 1);
        }
      }
      
      render();
      
      if (ripple.isActive) {
        requestAnimationFrame(animateRipple);
      }
    };
    
    requestAnimationFrame(animateRipple);
  };

  const animateRiverFlow = () => {
    if (stateRef.current.isAnimating) return;
    
    stateRef.current.isAnimating = true;
    const startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      stateRef.current.animationProgress = Math.min(elapsed / animationDuration, 1);
      stateRef.current.wavePhase = stateRef.current.animationProgress * Math.PI * 2;
      
      render();
      
      if (stateRef.current.animationProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        stateRef.current.isAnimating = false;
        startContinuousFlow();
      }
    };
    
    requestAnimationFrame(animate);
  };

  const startContinuousFlow = () => {
    let lastTime = Date.now();
    
    const animateFlow = () => {
      const currentTime = Date.now();
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      stateRef.current.wavePhase += delta * 0.001;
      render();
      
      requestAnimationFrame(animateFlow);
    };
    
    requestAnimationFrame(animateFlow);
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  );
});

EmotionRiverCanvas.displayName = 'EmotionRiverCanvas';

export default EmotionRiverCanvas;

