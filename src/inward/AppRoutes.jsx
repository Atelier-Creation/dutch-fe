// src/inward/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import InwardList from "./pages/InwardList";
import InwardForm from "./pages/InwardForm";

export const inwardMenuItems = [
  {
    key: "/inward/list",
    label: "Inward List",
    icon: null, // handled in Sidebar
  },
  {
    key: "/inward/add",
    label: "Add Inward",
    icon: null,
  },
];

const InwardRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<InwardList />} />
      <Route path="add" element={<InwardForm />} />
      <Route path="edit/:id" element={<InwardForm />} />
    </Routes>
  );
};

export default InwardRoutes;
