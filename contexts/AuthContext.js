import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import jwt from "jsonwebtoken";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    try {
      const {
        data: { data: token },
      } = await axios.post("/api/login", {
        username,
        password,
      });
      localStorage.setItem("token", token);
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);

      const {
        data: { data: userData },
      } = await axios.get(`/api/user/${userId}`);
      setCurrentUser(userData);

      return userData;
    } catch (error) {
      return error;
    }
  };

  const logout = async () => {
    await axios.post("/api/logout");
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  const register = async (
    firstName,
    lastName,
    username,
    password,
    role,
    avatar
  ) => {
    try {
      const {
        data: { data: token },
      } = await axios.post("/api/user", {
        firstName,
        lastName,
        username,
        password,
        role,
        avatar: avatar || null,
      });
      localStorage.setItem("token", token);
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);

      const {
        data: { data: userData },
      } = await axios.get(`/api/user/${userId}`);
      setCurrentUser(userData);

      return userData;
    } catch (error) {
      return error;
    }
  };

  const refreshUser = async () => {
    const {
      data: { data: userData },
    } = await axios.get(`/api/user/${currentUser._id}`);
    setCurrentUser(userData);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      axios.get(`/api/user/${userId}`).then((res) => {
        setCurrentUser(res.data.data);
        setLoading(false);
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ loading, refreshUser, currentUser, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
