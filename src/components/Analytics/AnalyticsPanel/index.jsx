import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./index.module.less";
import UserPreviewCard from "@/components/Analytics/UserPreviewCard";
import { FaUsers } from "react-icons/fa";

const API_URL = "https://v9fq463tb8.hzh.sealos.run/getAnalyticsStats";

function AnalyticsPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showUserPreview, setShowUserPreview] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // 计算默认日期范围（最近7天）
  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const endParts = formatter.formatToParts(now);
    const endYear = endParts.find((p) => p.type === "year").value;
    const endMonth = endParts.find((p) => p.type === "month").value;
    const endDay = endParts.find((p) => p.type === "day").value;
    const defaultEndDate = `${endYear}-${endMonth}-${endDay}`;

    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() - 6);
    const startParts = formatter.formatToParts(startTime);
    const startYear = startParts.find((p) => p.type === "year").value;
    const startMonth = startParts.find((p) => p.type === "month").value;
    const startDay = startParts.find((p) => p.type === "day").value;
    const defaultStartDate = `${startYear}-${startMonth}-${startDay}`;

    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  }, []);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          options: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.message || "获取数据失败");
      }
    } catch (err) {
      setError(err.message);
      console.error("获取分析数据失败:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // 初始加载和日期变化时重新加载
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate, fetchData]);

  // 统计数据
  const stats = useMemo(() => {
    const totalEvents = data.length;
    const uniqueUsers = new Set(data.map((item) => item.userId)).size;
    const uniqueCities = new Set(data.map((item) => item.city).filter(Boolean))
      .size;

    // 按事件类型统计
    const eventStats = {};
    data.forEach((item) => {
      eventStats[item.eventName] = (eventStats[item.eventName] || 0) + 1;
    });

    // 按日期统计
    const dailyStats = {};
    data.forEach((item) => {
      const date = item.time ? item.time.split(" ")[0] : "";
      if (date) {
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      }
    });

    // 按城市统计
    const cityStats = {};
    data.forEach((item) => {
      if (item.city) {
        cityStats[item.city] = (cityStats[item.city] || 0) + 1;
      }
    });

    // 按用户统计日志数量
    const userStats = {};
    const userEventsMap = {}; // 存储每个用户的所有事件
    data.forEach((item) => {
      if (item.userId) {
        userStats[item.userId] = (userStats[item.userId] || 0) + 1;
        if (!userEventsMap[item.userId]) {
          userEventsMap[item.userId] = {
            userId: item.userId,
            city: item.city,
            events: [],
          };
        }
        userEventsMap[item.userId].events.push({
          eventName: item.eventName,
          time: item.time,
          params: item.params || {},
        });
      }
    });

    // 构建用户列表，包含统计信息和事件列表
    const userList = Object.entries(userStats)
      .map(([userId, count]) => ({
        userId,
        count,
        city: userEventsMap[userId]?.city || "未知",
        events: userEventsMap[userId]?.events || [],
      }))
      .sort((a, b) => b.count - a.count);

    // 今日事件数
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayParts = formatter.formatToParts(today);
    const todayYear = todayParts.find((p) => p.type === "year").value;
    const todayMonth = todayParts.find((p) => p.type === "month").value;
    const todayDay = todayParts.find((p) => p.type === "day").value;
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
    const todayEvents = data.filter((item) => {
      const date = item.time ? item.time.split(" ")[0] : "";
      return date === todayStr;
    }).length;

    return {
      totalEvents,
      uniqueUsers,
      uniqueCities,
      todayEvents,
      eventStats,
      dailyStats,
      cityStats,
      userStats,
      userList,
    };
  }, [data]);

  // 事件类型筛选
  const [filterEventName, setFilterEventName] = useState("");

  // 打开用户预览
  const handleOpenUserPreview = () => {
    if (stats.userList && stats.userList.length > 0) {
      setCurrentUserIndex(0);
      setShowUserPreview(true);
    }
  };

  const handleUserChange = (user, index) => {
    setCurrentUserIndex(index);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h1 className={styles.title}>数据监控面板</h1>
        <div className={styles.controls}>
          <button
            onClick={handleOpenUserPreview}
            className={styles.userQueryButton}
            disabled={!stats.userList || stats.userList.length === 0}
            title="查看用户行为"
          >
            <FaUsers />
            <span>用户查询</span>
          </button>
          <div className={styles.dateRange}>
            <label>
              开始日期：
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
            </label>
            <label>
              结束日期：
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </label>
          </div>
          <button
            onClick={fetchData}
            className={styles.refreshButton}
            disabled={loading}
          >
            {loading ? "加载中..." : "刷新"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>错误: {error}</div>}

      {loading && data.length === 0 ? (
        <div className={styles.loading}>加载中...</div>
      ) : (
        <>
          {/* 核心指标 */}
          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>总事件数</div>
              <div className={styles.metricValue}>{stats.totalEvents}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>独立用户</div>
              <div className={styles.metricValue}>{stats.uniqueUsers}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>今日事件</div>
              <div className={styles.metricValue}>{stats.todayEvents}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>活跃城市</div>
              <div className={styles.metricValue}>{stats.uniqueCities}</div>
            </div>
          </div>

          {/* 事件类型统计 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>事件类型分布</h2>
            <div className={styles.eventStats}>
              {Object.entries(stats.eventStats)
                .sort((a, b) => b[1] - a[1])
                .map(([eventName, count]) => (
                  <div
                    key={eventName}
                    className={styles.eventStatItem}
                    onClick={() => {
                      setFilterEventName(
                        filterEventName === eventName ? "" : eventName
                      );
                    }}
                    style={{
                      backgroundColor:
                        filterEventName === eventName
                          ? "var(--accent-bg)"
                          : "transparent",
                    }}
                  >
                    <span className={styles.eventName}>{eventName}</span>
                    <span className={styles.eventCount}>{count}</span>
                    <span className={styles.eventPercent}>
                      ({((count / stats.totalEvents) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* 时间趋势 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>时间趋势</h2>
            <div className={styles.trendChartContainer}>
              {Object.keys(stats.dailyStats).length > 0 &&
                (() => {
                  const sortedEntries = Object.entries(stats.dailyStats).sort(
                    (a, b) => a[0].localeCompare(b[0])
                  );
                  const maxCount = Math.max(...Object.values(stats.dailyStats));

                  // 计算Y轴刻度：从0开始，到最大值，使用合理的间隔
                  const yAxisSteps = 5;
                  const yAxisMax =
                    maxCount === 0 ? 1 : Math.ceil(maxCount * 1.1); // 最大值向上取整，留10%余量
                  const yAxisInterval = Math.ceil(yAxisMax / yAxisSteps); // 计算间隔
                  const yAxisValues = [];
                  for (let i = 0; i <= yAxisSteps; i++) {
                    yAxisValues.push(i * yAxisInterval);
                  }

                  // 确保最大值包含在内
                  if (yAxisValues[yAxisValues.length - 1] < maxCount) {
                    yAxisValues[yAxisValues.length - 1] = Math.ceil(maxCount);
                  }

                  return (
                    <>
                      {/* Y轴 */}
                      <div className={styles.yAxis}>
                        {yAxisValues.reverse().map((value) => (
                          <div key={value} className={styles.yAxisLabel}>
                            {value}
                          </div>
                        ))}
                      </div>

                      {/* 图表区域 */}
                      <div className={styles.trendChart}>
                        {/* 网格线 */}
                        <div className={styles.gridLines}>
                          {yAxisValues.map((value, index) => (
                            <div
                              key={value}
                              className={styles.gridLine}
                              style={{
                                bottom: `${(index / yAxisSteps) * 100}%`,
                              }}
                            />
                          ))}
                        </div>

                        {/* 柱状图 */}
                        <div className={styles.barsContainer}>
                          {sortedEntries.map(([date, count]) => {
                            // 使用Y轴最大值计算高度，从0开始
                            const yAxisMax =
                              yAxisValues[yAxisValues.length - 1] || 1;
                            const height = (count / yAxisMax) * 100;
                            const month = date.split("-")[1];
                            const day = date.split("-")[2];
                            return (
                              <div key={date} className={styles.trendBar}>
                                <div className={styles.barWrapper}>
                                  <div
                                    className={styles.bar}
                                    style={{
                                      height: `${Math.max(height, 2)}%`,
                                    }}
                                    title={`${date}: ${count} 事件`}
                                  />
                                  <div className={styles.barValue}>{count}</div>
                                </div>
                                <div className={styles.barLabel}>
                                  <div className={styles.barDate}>
                                    {month}-{day}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
            </div>
          </div>

          {/* 用户日志统计 */}
          {Object.keys(stats.userStats).length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>用户日志数量</h2>
              <div className={styles.userStats}>
                {Object.entries(stats.userStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([userId, count]) => (
                    <div key={userId} className={styles.userItem}>
                      <span className={styles.userId}>{userId}</span>
                      <span className={styles.userCount}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 城市分布 */}
          {Object.keys(stats.cityStats).length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>城市分布</h2>
              <div className={styles.cityStats}>
                {Object.entries(stats.cityStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([city, count]) => (
                    <div key={city} className={styles.cityItem}>
                      <span className={styles.cityName}>{city}</span>
                      <span className={styles.cityCount}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
      {showUserPreview && stats.userList && stats.userList.length > 0 && (
        <UserPreviewCard
          user={stats.userList[currentUserIndex]}
          users={stats.userList}
          currentIndex={currentUserIndex}
          onClose={() => setShowUserPreview(false)}
          onUserChange={handleUserChange}
        />
      )}
    </div>
  );
}

export default AnalyticsPanel;
