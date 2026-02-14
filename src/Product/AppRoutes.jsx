import { Routes, Route } from "react-router-dom";
import ProductList from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";
import CategoryList from "./pages/CategoryList";
import CategoryAdd from "./pages/CategoryAdd";
import SubcategoryList from "./pages/SubcategoryList";
import SubcategoryForm from "./pages/SubcategoryForm";

export const ProductMenuItems = [
  {
    key: "/Product/list",
    label: "Products",
    icon: null,
  },
  {
    key: "/Product/categories",
    label: "Categories",
    icon: null,
  },
  {
    key: "/Product/subcategories",
    label: "Subcategories",
    icon: null,
  },
];

const ProductRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<ProductList />} />
      <Route path="add" element={<ProductForm />} />
      <Route path="edit/:id" element={<ProductForm />} />
      
      <Route path="categories" element={<CategoryList />} />
      <Route path="categories/add" element={<CategoryAdd />} />
      <Route path="categories/edit/:id" element={<CategoryAdd />} />
      
      <Route path="subcategories" element={<SubcategoryList />} />
      <Route path="subcategories/add" element={<SubcategoryForm />} />
      <Route path="subcategories/edit/:id" element={<SubcategoryForm />} />
    </Routes>
  );
};

export default ProductRoutes;
