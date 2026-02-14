import React, { useEffect, useState } from "react";
import {
  LogoutOutlined,
  UserOutlined,
  BellFilled,
} from "@ant-design/icons";
import { Dropdown, message, Menu, Popover, Badge, List, Avatar } from "antd";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import companyLogo from "../assets/Company_logo.png";
import BranchSelector from "../BranchSelector";

const HeaderBar = ({ collapsed /* this is optional */ }) => {
  const { theme, headerBgColor, headerGradient } = useTheme();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      message.success("Logged out");
      navigate("/");
    } else if (key === "profile") {
      navigate("/profile");
    }
  };

  // user menu (AntD Menu)
  const userMenu = (
    <Menu
      items={[
        {
          key: "profile",
          icon: <UserOutlined />,
          label: "Profile",
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Logout",
          danger: true,
        },
      ]}
      onClick={handleMenuClick}
    />
  );

  // Dummy recent bills for notifications
  const recentBills = [
    { id: 1, customer: "John Doe", amount: 1280.5 },
    { id: 2, customer: "Alice Rao", amount: 560.0 },
    { id: 3, customer: "Mohan Kumar", amount: 2300.75 },
  ];

  const notificationContent = (
    <div style={{ minWidth: 280 }}>
      <List
        size="small"
        dataSource={recentBills}
        renderItem={(item) => (
          <List.Item
            style={{ display: "flex", justifyContent: "space-between", padding: 8 }}
            key={item.id}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar style={{ backgroundColor: "#f0f2f5", color: "#000" }}>
                {item.customer.charAt(0)}
              </Avatar>
              <div>
                <div style={{ fontSize: 13 }}>{item.customer}</div>
                <div style={{ fontSize: 11, color: "#888" }}>Recent bill</div>
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>₹{item.amount.toFixed(2)}</div>
          </List.Item>
        )}
      />
      <div style={{ textAlign: "center", padding: 8, borderTop: "1px solid #f0f0f0" }}>
        <a onClick={() => message.info("Open all notifications")}>View all</a>
      </div>
    </div>
  );

  const isGradient = headerGradient && headerGradient.includes("gradient");
  const headerStyle = isGradient
    ? { background: headerGradient }
    : { backgroundColor: headerBgColor || "#ffffff" };

  const textColor = theme === "dark" || isGradient ? "#fff" : "#000";

  return (
    <div
      className="flex justify-between items-center shadow-lg h-14 px-4 py-2"
      style={{
        ...headerStyle,
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Left side: Logo */}
      <div className="flex items-center gap-3">
        <img
          src={companyLogo}
          alt="Logo"
          style={{ height: 36, width: "auto", cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        />
        <div style={{ color: textColor, fontWeight: 700 }}>Billing Software</div>
      </div>

      {/* Right side: Branch selector + notifications + user */}
      <div className="flex items-center gap-4">
        {/* Branch Selector */}
        <BranchSelector />

        {/* Notifications */}
        <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
        >
          <Badge count={recentBills.length}>
            <div
              className="cursor-pointer p-2 rounded-full"
              style={{
                background: theme === "dark" ? "#374151" : "#f3f4f6",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BellFilled style={{ fontSize: 18, color: textColor }} />
            </div>
          </Badge>
        </Popover>

        {/* User dropdown */}
        <Dropdown overlay={userMenu} placement="bottomRight" trigger={["click"]}>
          <div
            className="cursor-pointer p-2 rounded-full"
            style={{
              background: theme === "dark" ? "#374151" : "#f3f4f6",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserOutlined style={{ fontSize: 18, color: textColor }} />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderBar;
