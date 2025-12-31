import Layout from "./components/Layout/Layout";
import { ToastProvider } from "./components/Basic/Toast";

function App() {
  return (
    <ToastProvider>
      <Layout />
    </ToastProvider>
  );
}

export default App;
