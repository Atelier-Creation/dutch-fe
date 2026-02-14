import { Routes, Route } from "react-router-dom";
import StockList from "./pages/StockList";

export const stockMenuItems = [
  {
    key: "/stock/list",
    label: "Stock List",
    icon: null,
  },
];

const StockRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<StockList />} />
    </Routes>
  );
};

export default StockRoutes;
