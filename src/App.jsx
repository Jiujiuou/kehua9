import { useEffect, useState } from "react";
import Layout from "./components/Layout/Layout";
import AnalyticsPanel from "./components/Analytics/AnalyticsPanel";
import ReviewPanel from "./components/Review/ReviewPanel";
import { ToastProvider } from "./components/Basic/Toast";
import { ConfirmProvider } from "./components/Basic/Confirm";

function App() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    // 检测 URL 参数
    const params = new URLSearchParams(window.location.search);
    const analyticsData = params.get("analyticsData");
    const reviewData = params.get("reviewData");
    setShowAnalytics(analyticsData === "true");
    setShowReview(reviewData === "true");
  }, []);

  if (showAnalytics) {
    return (
      <ToastProvider>
        <ConfirmProvider>
          <AnalyticsPanel />
        </ConfirmProvider>
      </ToastProvider>
    );
  }

  if (showReview) {
    return (
      <ToastProvider>
        <ConfirmProvider>
          <ReviewPanel />
        </ConfirmProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Layout />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
