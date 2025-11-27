import React, { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../services/api";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const QRApprove = () => {
  const { backendUrl } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get("token");

  const approve = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/qr/approve`,
        { qrToken }
      );

      if (data.success) toast.success("QR approved. Desktop will login now!");
      else toast.error(data.message);
    } catch {
      toast.error("Error approving QR");
    }
  };

  return (
    <div>
      <p>Approve login on desktop?</p>
      <button onClick={approve}>Approve</button>
    </div>
  );
};

export default QRApprove;
