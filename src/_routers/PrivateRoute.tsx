import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAppSelector } from "../app/hooks";
import Loader from "../components/common/Loader";

type PrivateRouteProps = {
  children: ReactNode;
};

function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;
