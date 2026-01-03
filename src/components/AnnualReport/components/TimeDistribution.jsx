import { useEffect, useRef } from 'react';
import styles from './TimeDistribution.module.less';

/**
 * 时间分布图表组件
 * 展示24小时发布动态的分布情况
 */
const TimeDistribution = ({ hourlyStats, mostActiveHour }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !hourlyStats) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // 设置画布尺寸
    const containerWidth = canvas.parentElement.clientWidth;
    const width = Math.min(containerWidth, 800);
    const height = 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 计算最大值
    const maxCount = Math.max(...hourlyStats.map(s => s.count), 1);

    // 绘制参数
    const padding = { left: 30, right: 20, top: 20, bottom: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / 24;

    // 绘制坐标轴
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;

    // Y轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();

    // X轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // 绘制柱状图
    hourlyStats.forEach((stat, index) => {
      const x = padding.left + index * barWidth;
      const barHeight = (stat.count / maxCount) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // 高亮最活跃的小时
      const isActive = mostActiveHour && stat.hour === mostActiveHour.hour;
      
      // 渐变色
      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight);
      if (isActive) {
        gradient.addColorStop(0, '#FFD700'); // 金色高亮
        gradient.addColorStop(1, '#FFA500');
      } else {
        gradient.addColorStop(0, '#EA425F');
        gradient.addColorStop(1, 'rgba(234, 66, 95, 0.6)');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      // 绘制边框
      ctx.strokeStyle = isActive ? '#FFD700' : 'rgba(234, 66, 95, 0.5)';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x + 2, y, barWidth - 4, barHeight);
    });

    // 绘制X轴标签(每4小时一个)
    ctx.fillStyle = '#333333';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < 24; i += 4) {
      const x = padding.left + i * barWidth + barWidth / 2;
      const y = padding.top + chartHeight + 10;
      ctx.fillText(`${i}:00`, x, y);
    }

    // 绘制Y轴标签
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yLabels = [0, Math.floor(maxCount / 2), maxCount];
    yLabels.forEach(label => {
      const y = padding.top + chartHeight - (label / maxCount) * chartHeight;
      ctx.fillText(label.toString(), padding.left - 10, y);
    });

  }, [hourlyStats, mostActiveHour]);

  return (
    <div className={styles.timeDistribution}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default TimeDistribution;

