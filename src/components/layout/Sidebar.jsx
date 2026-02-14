// Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import {
  DownOutlined,
  UpOutlined,
  DashboardFilled,
  UnorderedListOutlined,
  PlusOutlined,
  MenuOutlined,
  CloseOutlined,
  ShoppingCartOutlined,
  FileTextFilled,
  DropboxCircleFilled,
  DatabaseFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingFilled,
} from "@ant-design/icons";
import { Popover } from "antd";

/**
 * Sidebar component
 * - Collapsed (desktop): parent icons centered; parents with children open a Popover flyout.
 * - Expanded or mobile: inline expand/collapse for parent children.
 * - Visual rules:
 *   Active: background #1C2244, text & icon color #ffffff
 *   Inactive: text & icon color #1C2244, background transparent
 * - Settings button is placed at the bottom and becomes active on the /settings route.
 */

const Sidebar = ({ 
  collapsed = true, 
  setCollapsed = () => {}, 
  selectedParent, 
  setSelectedParent,
  menuItems: propMenuItems = [] // Add menuItems prop
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, primaryColor, sidebarBgColor } = useTheme();
  const [openMenu, setOpenMenu] = useState(null); // stores key of open inline menu OR open popover
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const containerRef = useRef(null);

  // Colors requested
  const ACTIVE_BG = "#1C2244";
  const ACTIVE_TEXT = "#ffffff";
  const INACTIVE_TEXT = "#1C2244";
  const INACTIVE_BG = "transparent";

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popup when clicking outside (guard). Only closes popover when collapsed & desktop.
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpenMenu((prev) => {
          return prev && collapsed && !isMobile ? null : prev;
        });
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [collapsed, isMobile]);

  // === Use prop menuItems or fallback to static menu ===
  console.log('Sidebar propMenuItems:', propMenuItems);
  console.log('Sidebar propMenuItems.length:', propMenuItems.length);
  
  const menuItems = propMenuItems.length > 0 ? propMenuItems : [
    { key: "/dashboard", label: "Dashboard", icon: <DashboardFilled /> },
    {
      key: "Billing",
      label: "Casier Billing",
      icon: <FileTextFilled />,
      children: [
        { key: "/billing/list", label: "Billing List", icon: <UnorderedListOutlined /> },
        { key: "/billing/add", label: "Add Billing", icon: <PlusOutlined /> },
      ],
    },
    { key: "/billing/customer-add", label: "Self Checkout", icon: <PlusOutlined /> },
    {
      key: "Product",
      label: "Product",
      icon: <DropboxCircleFilled />,
      children: [
        { key: "/product/list", label: "Product List", icon: <UnorderedListOutlined /> },
        { key: "/product/add", label: "Add Product", icon: <PlusOutlined /> },
        { key: "/category/list", label: "Category List", icon: <UnorderedListOutlined /> },
        { key: "/category/add", label: "Add Category", icon: <PlusOutlined /> },
        { key: "/subcategory/list", label: "Subcategory List", icon: <UnorderedListOutlined /> },
        { key: "/subcategory/add", label: "Add Subcategory", icon: <PlusOutlined /> },
      ],
    },
    {
      key: "Inward",
      label: "Inward",
      icon: <ShoppingCartOutlined />,
      children: [
        { key: "/inward/list", label: "Inward List", icon: <UnorderedListOutlined /> },
        { key: "/inward/add", label: "Add Inward", icon: <PlusOutlined /> },
      ],
    },
    { key: "/stock/list", label: "Stocks", icon: <DatabaseFilled /> },
  ];
  // ===================

  // determine active state (parents active when any child matches)
  const isActive = (key) => {
    if (!key) return false;

    // If this key matches a parent item that has children, check children's routes
    const parentItem = menuItems.find((m) => m.key === key);
    if (parentItem && parentItem.children && parentItem.children.length > 0) {
      return parentItem.children.some((c) => {
        return (
          pathname === c.key ||
          pathname.startsWith(c.key + "/") ||
          pathname.includes(c.key.replace("/list", "").replace("/add", ""))
        );
      });
    }

    // Otherwise normal match for direct routes
    return (
      pathname === key ||
      pathname.startsWith(key + "/") ||
      pathname.includes(key.replace("/list", "").replace("/add", ""))
    );
  };

  // Build modern popover content for children (uses exact active/inactive colors requested)
  const buildPopoverContent = (item) => {
    const bg = theme === "dark" ? "#111827" : "#ffffff";
    const border = theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    return (
      <div
        style={{
          minWidth: 220,
          borderRadius: 10,
          boxShadow: "0 8px 30px rgba(2,6,23,0.2)",
          background: bg,
          color: INACTIVE_TEXT,
          overflow: "hidden",
          border: `1px solid ${border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, fontWeight: 700, color: INACTIVE_TEXT }}>
          {item.label}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 8 }}>
          {item.children.map((child) => {
            const active = isActive(child.key);
            return (
              <div
                key={child.key}
                onClick={(e) => {
                  e.stopPropagation();
                  // navigate first, then close popover
                  navigate(child.key);
                  setOpenMenu(null);
                  if (isMobile) setCollapsed(false);
                }}
                role="button"
                tabIndex={0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: active ? ACTIVE_BG : INACTIVE_BG,
                  color: active ? ACTIVE_TEXT : INACTIVE_TEXT,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: active ? ACTIVE_TEXT : INACTIVE_TEXT }}>
                  {child.icon}
                </span>
                <div style={{ fontSize: 14 }}>{child.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // render parent button: when collapsed + desktop + has children => show popover, else inline expand or navigate
  const renderParentButton = (item) => {
    const active = isActive(item.key);

    // Collapsed & Desktop & has children => use Popover (modern flyout)
    if (collapsed && !isMobile && item.children) {
      return (
        <Popover
          content={buildPopoverContent(item)}
          trigger="click"
          placement="rightTop"
          overlayClassName="sidebar-flyout-popover"
          visible={openMenu === item.key}
          onVisibleChange={(visible) => setOpenMenu(visible ? item.key : null)}
          getPopupContainer={() => containerRef.current || document.body} // render inside sidebar container
          destroyTooltipOnHide
          overlayStyle={{ zIndex: 3000 }}
        >
          <div
            style={{
              padding: 8,
              cursor: "pointer",
              margin: "8px 0", // slightly larger vertical spacing when collapsed for better centering
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // centered when collapsed
              color: active ? ACTIVE_TEXT : INACTIVE_TEXT,
              background: active ? ACTIVE_BG : INACTIVE_BG,
              fontWeight: active ? "bold" : 500,
              transition: "all 0.15s ease",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: active ? ACTIVE_TEXT : INACTIVE_TEXT }}>
              {item.icon}
            </span>
          </div>
        </Popover>
      );
    }

    // Normal behavior (not collapsed or mobile)
    return (
      <div
        onClick={() => {
          if (item.children) {
            setOpenMenu(openMenu === item.key ? null : item.key);
          } else {
            navigate(item.key);
            if (isMobile) setCollapsed(false);
            setOpenMenu(null);
          }
        }}
        style={{
          padding: collapsed && !isMobile ? 8 : "8px 16px",
          cursor: "pointer",
          margin: "4px 0",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "flex-start", // center icon when collapsed
          color: active ? ACTIVE_TEXT : INACTIVE_TEXT,
          backgroundColor: active ? ACTIVE_BG : INACTIVE_BG,
          fontWeight: active ? "bold" : 500,
          transition: "all 0.2s ease",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: active ? ACTIVE_TEXT : INACTIVE_TEXT }}>
          {item.icon}
        </span>
        {/* show label only when not collapsed OR on mobile */}
        {(!collapsed || isMobile) && <span style={{ marginLeft: 10 }}>{item.label}</span>}
        {item.children && (!collapsed || isMobile) && (
          <span style={{ marginLeft: "auto", fontSize: 16, color: active ? ACTIVE_TEXT : INACTIVE_TEXT }}>{openMenu === item.key ? <UpOutlined /> : <DownOutlined />}</span>
        )}
      </div>
    );
  };

  // Settings active check
  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <>
      {/* Mobile Hamburger / Close */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 2100,
            cursor: "pointer",
            background: "#fff",
            borderRadius: "50%",
            padding: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <CloseOutlined /> : <MenuOutlined />}
        </div>
      )}

      <AnimatePresence initial={false}>
        {(isMobile ? collapsed : true) && (
          <div ref={containerRef} style={{ height: "100%" }}>
            {isMobile && collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "black",
                  zIndex: 1500,
                }}
                onClick={() => setCollapsed(false)}
              />
            )}

            <motion.div
              initial={{ x: isMobile ? -300 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -300 : 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                height: "100%",
                width: collapsed && !isMobile ? 60 : isMobile ? 200 : 200,
                backgroundColor: theme === "dark" ? "#1f2937" : sidebarBgColor,
                boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                position: isMobile ? "fixed" : "relative",
                top: 0,
                left: 0,
                zIndex: 1601,
              }}
            >
              {/* Top (toggle) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed && !isMobile ? "center" : "space-between",
                  padding: "10px 12px",
                }}
              >
                <div>
                  <div
                    onClick={() => setCollapsed((prev) => !prev)}
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      color: "#ffffff",
                      background: primaryColor,
                      borderRadius: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    title={collapsed ? "Open sidebar" : "Close sidebar"}
                  >
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  </div>
                </div>

                {(!collapsed || isMobile) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* small logo intentionally omitted */}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div style={{ flexGrow: 1, overflowY: "auto", padding: collapsed && !isMobile ? "8px 4px" : 8 }}>
                {menuItems.map((item) => (
                  <div key={item.key}>
                    {renderParentButton(item)}

                    {/* Inline submenu when expanded or on mobile */}
                    <AnimatePresence initial={false}>
                      {item.children && openMenu === item.key && (!collapsed || isMobile) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          style={{ marginLeft: 24, overflow: "hidden" }}
                        >
                          {item.children.map((child) => {
                            const childActive = isActive(child.key);
                            return (
                              <div
                                key={child.key}
                                onClick={() => {
                                  // navigate and keep parent open (so it's visibly active)
                                  navigate(child.key);
                                  setOpenMenu(item.key); // keep parent open / active in inline mode
                                  if (isMobile) setCollapsed(false);
                                }}
                                style={{
                                  padding: "6px 8px",
                                  cursor: "pointer",
                                  margin: "6px 0",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  color: childActive ? ACTIVE_TEXT : INACTIVE_TEXT,
                                  backgroundColor: childActive ? ACTIVE_BG : INACTIVE_BG,
                                  fontWeight: childActive ? "700" : 500,
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <span style={{ marginRight: 8, color: childActive ? ACTIVE_TEXT : INACTIVE_TEXT }}>{child.icon}</span>
                                <span style={{ marginLeft: 8 }}>{child.label}</span>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Settings (sticky bottom) */}
              <div
                onClick={() => {
                  navigate("/settings");
                  if (isMobile) setCollapsed(false);
                }}
                role="button"
                tabIndex={0}
                style={{
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                  cursor: "pointer",
                  marginTop: "auto",
                  borderTop: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)"}`,
                  backgroundColor: settingsActive ? ACTIVE_BG : INACTIVE_BG,
                  color: settingsActive ? ACTIVE_TEXT : INACTIVE_TEXT,
                }}
              >
                <SettingFilled style={{ fontSize: 18, color: settingsActive ? ACTIVE_TEXT : INACTIVE_TEXT }} />
                {(!collapsed || isMobile) && <span style={{ marginLeft: 8, color: settingsActive ? ACTIVE_TEXT : INACTIVE_TEXT }}>Settings</span>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
