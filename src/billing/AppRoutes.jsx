// src/billing/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import BillingList from "./pages/billingList";
import BillingForm from "./pages/billingForm";
import CustomerBillingForm from "./pages/CustomerBillingForm";
import CustomerBillCopy from "./pages/CustomerBillCopy";
import SalesReport from "./pages/SalesReport";

export const billingMenuItems = [
  {
    key: "/billing/list",
    label: "Billing List",
    icon: null,
  },
  {
    key: "/billing/add",
    label: "Add Billing",
    icon: null,
  },
  {
    key: "/billing/customer-add",
    label: "Add Customer Billing",
    icon: null,
  },
  {
    key: "/billing/reports",
    label: "Sales Report",
    icon: null,
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
