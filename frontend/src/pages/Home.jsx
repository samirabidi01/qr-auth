import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h1>Welcome to QR Login Demo</h1>
      <Link to="/qr-login">Login with QR</Link>
    </div>
  );
};

export default Home;
