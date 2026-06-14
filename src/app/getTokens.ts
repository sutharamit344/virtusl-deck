import { ErrorToast } from "../components/toast/Toasts";
import { axiosApiInstance } from "./axios";
import { API_URL } from "./config";

export const getLocalAccessToken = () => {
  const token = localStorage.getItem("Token") as string;
  return token;
};

export const getLocalRefreshToken = () => {
  const refreshToken = localStorage.getItem("RefreshToken") as string;
  return refreshToken;
};

export const getRefreshToken = async () => {
  try {
    return await axiosApiInstance.post(
      `${API_URL}/UserLogin/CheckRefreshToken`,
      {
        refreshToken: getLocalRefreshToken(),
      }
    );
  } catch (error: any) {
    ErrorToast(error?.response?.data?.msg);
    console.error(error?.response?.data?.msg);
  }
};
