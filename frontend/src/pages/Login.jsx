import React, { useState, useContext } from "react";
import axiossinstance from "../services/api";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { Link ,useNavigate} from "react-router-dom";
const Login = () => {
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate=useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiossinstance.post(`${backendUrl}/api/auth/login`, { email, password },{ withCredentials: true });
      console.log(res);
      
      if (res.data.success) {
        toast.success(res.data.message);
        setIsLoggedin(true);
        getUserData();
        navigate("/dashboard")
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <Link to="/register">
     <p> Don't have an account </p>
     </Link>
    </div>
  );
};

export default Login;
