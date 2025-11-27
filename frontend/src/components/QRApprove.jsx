import React, { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useSearchParams } from "react-router-dom";
import axios from "../services/api";
import { toast } from "react-toastify";

const QRApprove = () => {
  const { backendUrl } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get("token");
  const mobileJWT = localStorage.getItem("token"); // mobile user token
console.log("MOBILE TOKEN =", mobileJWT);

  useEffect(() => {
    if (!qrToken) return;
    const approve = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/auth/qr/approve`,
          { qrToken },
          { headers: { Authorization: `Bearer ${mobileJWT}` } }
        );
        if (data.success) toast.success("QR approved. Desktop will login!");
        else toast.error(data.message);
      } catch (err) {
        toast.error("Error approving QR");
      }
    };
    approve();
  }, [qrToken]);

  return <div>Approving QR... Please wait.</div>;
};

export default QRApprove;