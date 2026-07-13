import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardFull from "./pages/dashboardFull";
import ModernDashboard from "./pages/ModernDashboard";
import { LayoutDashboard } from "lucide-react";

export const dashboardMenuItems = [
  {
    key: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    key: "/dashboard/v2",
    label: "Dashboard V2",
    icon: <LayoutDashboard size={20} />,
  },
];

const DashboardRoutes = () => {
  return (
    <Routes>
      {/* index → matches /dashboard */}
      <Route index element={<DashboardFull />} />
      <Route path="v2" element={<ModernDashboard />} />
    </Routes>
  );
};

export default DashboardRoutes;
