import React, { useState } from "react";
import "./Login.css";
import logo from "../components/assets/Company_logo.png";
import x_logo from "../components/assets/Dark Logo.png";
import { FaEnvelope, FaEye, FaEyeSlash, FaPhone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { message, Spin } from "antd";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth(); // Get setUser from AuthContext

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [isMobileLogin, setIsMobileLogin] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile) => /^\d{10}$/.test(mobile);

  const routeModules = import.meta.glob("../*/AppRoutes.jsx", { eager: true });

  const modules = Object.entries(routeModules).map(([path, mod]) => {
    const match = path.match(/\.\/(.*?)\/AppRoutes\.jsx$/);
    const name = match?.[1];
    return {
      name,
      path: `/${name}/*`,
      element: mod.default,
      menuItems: mod[`${name}MenuItems`] || [],
    };
  });

  const getDefaultRedirect = () => {
    const companyModule = modules.find((mod) => mod.name === "company");
    const filteredModules = modules.filter((mod) => mod.name !== "dashboard");

    if (companyModule) {
      const nextModule = filteredModules.find((mod) => mod.name !== "company");
      if (nextModule) {
        return `/${nextModule.name}/pages/dashboard`;
      }
    }
    return filteredModules.length > 0
      ? `/${filteredModules[0].name}/pages/dashboard`
      : "/404";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setMobileError("");
    setPasswordError("");
    setLoginError("");

    let hasError = false;

    if (isMobileLogin) {
      if (!mobile.trim()) {
        setMobileError("Mobile number is required");
        hasError = true;
      } else if (!isValidMobile(mobile)) {
        setMobileError("Please enter a valid 10-digit mobile number");
        hasError = true;
      }
    } else {
      if (!email.trim()) {
        setEmailError("Email is required");
        hasError = true;
      } else if (!isValidEmail(email)) {
        setEmailError("Please enter a valid email address");
        hasError = true;
      }
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const payload = {
        identifier: isMobileLogin ? mobile : email,
        password,
      };

      const res = await api.post("/user/login", payload);

      // ✅ rename message → responseMessage to avoid conflict
      const { message: responseMessage, token, refreshToken, user } = res.data;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        // Update AuthContext with user data
        setUser(user);

        // ✅ AntD success message
        message.success(`${responseMessage} 🎉 Welcome, ${user.username}!`);

        // redirect
        navigate("/dashboard");
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed!";
      setLoginError(errorMessage);

      // ❌ show AntD error toast
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () =>
    setShowPassword((prev) => !prev);

  const toggleLoginMode = () => {
    setIsMobileLogin(!isMobileLogin);
    setEmail("");
    setMobile("");
    setEmailError("");
    setMobileError("");
    setLoginError("");
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="welcome-container">
          <h3 className="welcome-heading">
            Welcome to &nbsp;
            <img src={x_logo} alt="XTOWN" />
            Atelier..!
          </h3>
          <span className="welcome-tagline">
            We’re here to turn your ideas into reality.
          </span>
        </div>
      </div>

      <div className="login-right">
        <img src={logo} alt="Company Logo" className="logo" />

        <form className="login-form" onSubmit={handleSubmit}>
          <h3>LOGIN TO YOUR ACCOUNT</h3>
          {loginError && (
            <div
              className="login-error-message"
              style={{ marginBottom: "1rem", textAlign: "center" }}
            >
              {loginError}
            </div>
          )}

          <div
            className={`form-group ${isMobileLogin ? "mobile" : "email"} ${
              isMobileLogin ? mobileError : emailError ? "error" : ""
            } mb-4`}
          >
            <div className="input-wrapper">
              {isMobileLogin ? (
                <>
                  <input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className={mobile ? "filled" : ""}
                    placeholder="Mobile Number"
                    maxLength={10}
                  />
                  <label htmlFor="mobile">Mobile Number</label>
                  <FaEnvelope
                    className="input-icon toggle-icon"
                    onClick={toggleLoginMode}
                    title="Use Email instead"
                  />
                </>
              ) : (
                <>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={email ? "filled" : ""}
                    placeholder="Email"
                  />
                  <label htmlFor="email">Email</label>
                  <FaPhone
                    className="input-icon toggle-icon"
                    onClick={toggleLoginMode}
                    title="Use Mobile Number instead"
                  />
                </>
              )}
            </div>
            {isMobileLogin && mobileError && (
              <div className="login-error-message">{mobileError}</div>
            )}
            {!isMobileLogin && emailError && (
              <div className="login-error-message">{emailError}</div>
            )}
          </div>
          <div
            className={`form-group password ${passwordError ? "error" : ""}`}
          >
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={password ? "filled" : ""}
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
              {showPassword ? (
                <FaEyeSlash
                  className="input-icon toggle-icon"
                  onClick={togglePasswordVisibility}
                  title="Hide Password"
                />
              ) : (
                <FaEye
                  className="input-icon toggle-icon"
                  onClick={togglePasswordVisibility}
                  title="Show Password"
                />
              )}
            </div>
            {passwordError && (
              <div className="login-error-message">{passwordError}</div>
            )}
          </div>

          <button type="submit" className="log-button" disabled={loading}>
            {loading ? <Spin /> : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
