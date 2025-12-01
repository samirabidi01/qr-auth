import axios from "axios";

const axiosinstance = axios.create({
  withCredentials: true, 
});

export default axiosinstance;
