import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg text-center">
        <h1 className="text-2xl font-semibold mb-6">Welcome</h1>

        <div className="space-y-4">
          <Link
            to="/login"
            className="block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Login
          </Link>

          <Link
            to="/qr-login"
            className="block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Login with QR Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
