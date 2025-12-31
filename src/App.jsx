import Layout from "./components/Layout/Layout";
import { ToastProvider } from "./components/Basic/Toast";
import { ConfirmProvider } from "./components/Basic/Confirm";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Layout />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
