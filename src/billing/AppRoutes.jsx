// src/billing/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import BillingList from "./pages/billingList";
import BillingForm from "./pages/billingForm";
import CustomerBillingForm from "./pages/CustomerBillingForm";
import CustomerBillCopy from "./pages/CustomerBillCopy";
import SalesReport from "./pages/SalesReport";
import { List, PlusCircle, UserPlus, BarChart } from "lucide-react";

export const billingMenuItems = [
  {
    key: "/billing/list",
    label: "Billing List",
    icon: <List size={18} />,
  },
  {
    key: "/billing/add",
    label: "Add Billing",
    icon: <PlusCircle size={18} />,
  },
  {
    key: "/billing/customer-add",
    label: "Add Customer Billing",
    icon: <UserPlus size={18} />,
  }
];

const BillingRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<BillingList />} />
      <Route path="add" element={<BillingForm />} />
      <Route path="edit/:id" element={<BillingForm />} />
      <Route path="customer-add" element={<CustomerBillingForm />} />
      <Route path="customer-copy" element={<CustomerBillCopy />} />
      <Route path="reports" element={<SalesReport />} />
    </Routes>
  );
};

export default BillingRoutes;
