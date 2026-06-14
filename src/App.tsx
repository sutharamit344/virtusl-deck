import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Suspense } from "react";
import Loader from "./components/common/Loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MainRoutes } from "./_routers/Router";
import { useAuthWatcher } from "./_hooks/useAuthWatcher";

function App() {
  useAuthWatcher();

  return (
    <>
      <ToastContainer />
      <Suspense fallback={<Loader />}>
        <MainRoutes />
      </Suspense>
    </>
  );
}

export default App;
