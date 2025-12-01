import React, { createContext, useState } from "react";
import axiosinstance from "../services/api";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);

  const getUserData = async () => {
    try {
      const res = await axiosinstance.get(`${backendUrl}/api/user/me`);
      if (res.data.success) {
        setUserData(res.data.user);
        setIsLoggedin(true);
      }
    } catch (err) {
      setIsLoggedin(false);
      setUserData(null);
    }
  };

  return (
    <AppContext.Provider
      value={{ backendUrl, isLoggedin, setIsLoggedin, userData, getUserData }}
    >
      {children}
    </AppContext.Provider>
  );
};
