import { useEffect, useState } from "react";
import Layout from "./components/Layout/Layout";
import AnalyticsPanel from "./components/Analytics/AnalyticsPanel";
import { ToastProvider } from "./components/Basic/Toast";
import { ConfirmProvider } from "./components/Basic/Confirm";

function App() {
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    // 检测 URL 参数
    const params = new URLSearchParams(window.location.search);
    const analyticsData = params.get("analyticsData");
    setShowAnalytics(analyticsData === "true");
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

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Layout />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
