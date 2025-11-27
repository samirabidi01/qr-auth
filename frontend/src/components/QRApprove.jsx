import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../services/api";
import { toast } from "react-toastify";

const QRApprove = () => {
  const { backendUrl } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  
  const qrToken = searchParams.get("token");
  const mobileJWT = localStorage.getItem("token");

  console.log("QR Token from URL:", qrToken);
  console.log("Mobile JWT:", mobileJWT);

  useEffect(() => {
    if (!qrToken) {
      setStatus("error");
      toast.error("No QR token found in URL");
      return;
    }

    if (!mobileJWT) {
      setStatus("error");
      toast.error("Please login on mobile first");
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    const approveQR = async () => {
      try {
        console.log("Sending approval request...");
        const { data } = await axios.post(
          `${backendUrl}/api/auth/qr/approve`,
          { qrToken },
          { 
            headers: { 
              Authorization: `Bearer ${mobileJWT}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        console.log("Approval response:", data);
        
        if (data.success) {
          setStatus("success");
          toast.success("QR approved successfully! Desktop will login.");
          // Redirect back to home after success
          setTimeout(() => navigate("/"), 3000);
        } else {
          setStatus("error");
          toast.error(data.message || "Failed to approve QR");
        }
      } catch (err) {
        console.error("Approval error:", err);
        setStatus("error");
        toast.error(err.response?.data?.message || "Error approving QR");
      }
    };

    approveQR();
  }, [qrToken, mobileJWT, backendUrl, navigate]);

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 20px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2>QR Approval</h2>
      
      {status === "processing" && (
        <div>
          <p>Processing QR approval...</p>
          <div style={{ margin: '20px 0' }}>
            <div className="spinner"></div>
          </div>
        </div>
      )}
      
      {status === "success" && (
        <div style={{ color: 'green' }}>
          <p>✅ QR approved successfully!</p>
          <p>Redirecting you back to home...</p>
        </div>
      )}
      
      {status === "error" && (
        <div style={{ color: 'red' }}>
          <p>❌ Failed to approve QR</p>
          <p>Please try again.</p>
        </div>
      )}
    </div>
  );
};

export default QRApprove;