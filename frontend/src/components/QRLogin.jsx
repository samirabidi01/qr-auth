import React, { useEffect, useState, useContext } from "react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "../services/api";
import socket from "../utils/socket";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const QRLogin = () => {
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContext);
  const [qrToken, setQrToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [qrTimeLeft, setQrTimeLeft] = useState(0);

  const generateQr = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/qr/generate`);
      if (data.success) {
        setQrToken(data.qrToken);
        setExpiresIn(data.expiresIn);
        setQrTimeLeft(data.expiresIn);
        socket.emit("subscribe", data.qrToken);
      }
    } catch (err) {
      toast.error("Failed to generate QR");
    }
  };

  // QR Timer
  useEffect(() => {
    if (!qrToken) return;
    const timer = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("QR expired. Refresh.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrToken]);

  useEffect(() => {
    socket.on("qr-approved", async () => {
      try {
        const jwtRes = await axios.post(`${backendUrl}/api/auth/qr/verify`, { qrToken });
        if (jwtRes.data.success) {
          await getUserData();
          setIsLoggedin(true);
          toast.success("Logged in successfully!");
        }
      } catch (err) {
        toast.error("QR verification failed");
      }
    });

    return () => socket.off("qr-approved");
  }, [qrToken]);

  return (
    <div>
      {!qrToken && <button onClick={generateQr}>Generate QR</button>}
      {qrToken && (
        <div>
          <QRCodeCanvas value={`${backendUrl}/api/qr/open?token=${qrToken}`} size={180} />
          <p>Expires in {qrTimeLeft} s</p>
          <button onClick={generateQr}>Refresh QR</button>
        </div>
      )}
    </div>
  );
};

export default QRLogin;
