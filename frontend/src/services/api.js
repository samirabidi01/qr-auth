import axios from "axios";

const instance = axios.create({
  withCredentials: true, // send cookies
});

export default instance;
