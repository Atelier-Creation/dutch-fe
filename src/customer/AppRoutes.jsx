import { Routes, Route } from "react-router-dom";
import CustomerList from "./pages/CustomerList";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetails from "./pages/CustomerDetails";

export const customerMenuItems = [
  {
    key: "/customer/list",
    label: "Customer List",
    icon: null,
  },
  {
    key: "/customer/add",
    label: "Add Customer",
    icon: null,
  },
];

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<CustomerList />} />
      <Route path="add" element={<CustomerForm />} />
      <Route path="edit/:id" element={<CustomerForm />} />
      <Route path="details/:id" element={<CustomerDetails />} />
    </Routes>
  );
};

export default CustomerRoutes;
