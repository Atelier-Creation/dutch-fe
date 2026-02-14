import { Routes, Route } from "react-router-dom";
import CouponValidator from "./pages/CouponValidator";
import CustomerCoupons from "./pages/CustomerCoupons";
import PointsManagement from "./pages/PointsManagement";

export const couponMenuItems = [
  {
    key: "/coupon/validate",
    label: "Validate Coupon",
    icon: null,
  },
  {
    key: "/coupon/customer-coupons",
    label: "Customer Coupons",
    icon: null,
  },
  {
    key: "/coupon/points",
    label: "Points Management",
    icon: null,
  },
];

const CouponRoutes = () => {
  return (
    <Routes>
      <Route path="validate" element={<CouponValidator />} />
      <Route path="customer-coupons" element={<CustomerCoupons />} />
      <Route path="points" element={<PointsManagement />} />
    </Routes>
  );
};

export default CouponRoutes;
