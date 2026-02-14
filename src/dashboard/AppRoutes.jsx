import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardFull from "./pages/dashboardFull";

export const dashboardMenuItems = [
  {
    key: "/dashboard",
    label: "Dashboard",
    icon: <span>📊</span>,
  },
];

const DashboardRoutes = () => {
  return (
    <Routes>
      {/* index → matches /dashboard */}
      <Route index element={<DashboardFull />} />
    </Routes>
  );
};

export default DashboardRoutes;
