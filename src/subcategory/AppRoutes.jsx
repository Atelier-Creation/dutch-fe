import { Routes, Route } from "react-router-dom";
import SubcategoryList from "../Product/pages/SubcategoryList";
import SubcategoryForm from "../Product/pages/SubcategoryForm";

// Sidebar menu items for Subcategory
export const subcategoryMenuItems = [
  {
    key: "/subcategory/list",
    label: "Subcategory List",
    icon: null, // Icon handled in Sidebar
  },
  {
    key: "/subcategory/add",
    label: "Add Subcategory",
    icon: null,
  },
];

const SubcategoryRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<SubcategoryList />} />
      <Route path="add" element={<SubcategoryForm />} />
      <Route path="edit/:id" element={<SubcategoryForm />} />
    </Routes>
  );
};

export default SubcategoryRoutes;
