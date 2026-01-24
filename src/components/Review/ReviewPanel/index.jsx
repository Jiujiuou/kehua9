import { useState, useEffect, useCallback } from "react";
import styles from "./index.module.less";

// API 地址（需要用户提供后替换）
const GET_PRESTORE_DATA_API = "https://v9fq463tb8.hzh.sealos.run/getPreStoreData";
const APPROVE_TO_REPORT_DATA_API = "https://v9fq463tb8.hzh.sealos.run/approveToReportData";

function ReviewPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  // 获取待审核数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GET_PRESTORE_DATA_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
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
      console.error("获取待审核数据失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 处理审核（通过或拒绝）
  const handleReview = useCallback(
    async (id, approved) => {
      // 防止重复点击
      if (processingIds.has(id)) {
        return;
      }

      setProcessingIds((prev) => new Set(prev).add(id));

      try {
        const response = await fetch(APPROVE_TO_REPORT_DATA_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            approved: approved,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // 审核成功后，从列表中移除该项
          setData((prevData) => prevData.filter((item) => item._id?.toString() !== id?.toString()));
        } else {
          throw new Error(result.message || "审核操作失败");
        }
      } catch (err) {
        console.error("审核操作失败:", err);
        alert(`审核失败：${err.message || "未知错误"}`);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [processingIds]
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h1 className={styles.title}>留言审核面板</h1>
        <div className={styles.controls}>
          <button onClick={fetchData} className={styles.refreshButton} disabled={loading}>
            {loading ? "加载中..." : "刷新"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>错误: {error}</div>}

      {loading && data.length === 0 ? (
        <div className={styles.loading}>加载中...</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>暂无待审核数据</div>
      ) : (
        <div className={styles.list}>
          {data.map((item) => {
            const isProcessing = processingIds.has(item._id?.toString());
            return (
              <div key={item._id?.toString()} className={styles.item}>
                <div className={styles.itemHeader}>
                  <div className={styles.userName}>用户：{item.userName || "未知"}</div>
                  <div className={styles.time}>时间：{item.time || "未知"}</div>
                </div>
                <div className={styles.content}>{item.content || ""}</div>
                <div className={styles.actions}>
                  <button
                    className={`${styles.approveButton} ${styles.button}`}
                    onClick={() => handleReview(item._id, true)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "处理中..." : "通过"}
                  </button>
                  <button
                    className={`${styles.rejectButton} ${styles.button}`}
                    onClick={() => handleReview(item._id, false)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "处理中..." : "拒绝"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReviewPanel;
