import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../services/api";
import { toast } from "react-toastify";

const QRApprove = () => {
  const { backendUrl } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const qrToken = searchParams.get("token");

  const [mobileJWT, setMobileJWT] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error

  // Load mobile JWT once
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setMobileJWT(storedToken !== null ? storedToken : ""); 
  }, []);

  // Approve QR ONLY after mobileJWT is loaded
  useEffect(() => {
    // 1️⃣ Wait until mobileJWT is loaded (null means "not loaded yet")
    if (mobileJWT === null) return;

    // 2️⃣ Validate QR token
    if (!qrToken) {
      setStatus("error");
      toast.error("Invalid QR code");
      return;
    }

    // 3️⃣ User NOT logged in on mobile
    if (!mobileJWT) {
      setStatus("error");
      toast.error("Please login on mobile first");
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    // 4️⃣ Approve QR after all checks
    const approve = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/auth/qr/approve`,
          { qrToken },
          {
            headers: {
              Authorization: `Bearer ${mobileJWT}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (data.success) {
          setStatus("success");
          toast.success("QR approved! Desktop will log in.");

          setTimeout(() => navigate("/"), 2500);
        } else {
          setStatus("error");
          toast.error(data.message || "Failed to approve QR");
        }
      } catch (err) {
        setStatus("error");
        toast.error(err.response?.data?.message || "QR approval error");
      }
    };

    approve();
  }, [mobileJWT, qrToken, backendUrl, navigate]);

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <h2>QR Approval</h2>

      {status === "loading" && (
        <p>Processing QR approval...</p>
      )}

      {status === "success" && (
        <p style={{ color: "green" }}>✅ QR Approved! Redirecting...</p>
      )}

      {status === "error" && (
        <p style={{ color: "red" }}>❌ QR Approval Failed</p>
      )}
    </div>
  );
};

export default QRApprove;
