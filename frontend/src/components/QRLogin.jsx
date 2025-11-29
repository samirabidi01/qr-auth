import React, { useEffect, useState, useContext } from "react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "../services/api";
import socket from "../utils/socket";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const QRLogin = () => {
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContext);
  const [qrToken, setQrToken] = useState("");
  const [qrTimeLeft, setQrTimeLeft] = useState(0);

  // Generate QR
  const generateQr = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/qr/generate`);
      if (data.success) {
        setQrToken(data.qrToken);
        setQrTimeLeft(data.expiresIn);
        socket.emit("subscribe", data.qrToken);
      }
    } catch {
      toast.error("Failed to generate QR");
    }
  };

  // QR countdown
  useEffect(() => {
    if (!qrToken) return;
    const timer = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQrToken(""); // Reset QR token
          toast.error("QR expired. Refresh.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrToken]);

  // Listen for QR approval (desktop)
  useEffect(() => {
    socket.on("qr-approved", async () => {
      try {
        const jwtRes = await axios.post(`${backendUrl}/api/auth/qr/verify`, { qrToken });
        if (jwtRes.data.success) {
          await getUserData();
          setIsLoggedin(true);
          toast.success("Logged in successfully!");
          setQrToken(""); // Clear QR after success
        }
      } catch {
        toast.error("QR verification failed");
      }
    });

    return () => socket.off("qr-approved");
  }, [qrToken]);

  // Get the current frontend URL for QR code
  const getQRCodeValue = () => {
    // Use the current origin (frontend URL)
    const frontendUrl ="https://front-c2si.onrender.com"
    console.log("QR Code URL:", `${frontendUrl}/qr-approve?token=${qrToken}`);
    return `${frontendUrl}/qr-approve?token=${qrToken}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>QR Code Login</h2>
      {!qrToken ? (
        <button 
          onClick={generateQr}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Generate QR Code
        </button>
      ) : (
        <div>
          <p>Scan this QR code with your mobile app:</p>
          <div style={{ margin: '20px 0' }}>
            <QRCodeCanvas value={getQRCodeValue()} size={200} />
          </div>
          <p>Expires in: {qrTimeLeft} seconds</p>
          <button 
            onClick={generateQr}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default QRLogin;