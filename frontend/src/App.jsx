import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import QRLogin from "./components/QRLogin";
import QRApprove from "./components/QRApprove";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/qr-login" element={<QRLogin />} />
        <Route path="/qr-approve" element={<QRApprove />} />
      </Routes>
    </Router>
  );
};

export default App;
