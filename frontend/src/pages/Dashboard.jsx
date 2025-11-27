import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const Dashboard = () => {
  const { userData } = useContext(AppContext);

  return (
    <div>
      <h1>Dashboard</h1>
      {userData ? (
        <div>
          <p>Name: {userData.name}</p>
          <p>Email: {userData.email}</p>
        </div>
      ) : (
        <p>Loading user...</p>
      )}
    </div>
  );
};

export default Dashboard;
