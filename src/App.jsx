import { Suspense, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/Mainlayout";
// import hrms from "./components/assets/candidate.png";
import dashboard from "./components/assets/dashboard.png";
import CustomerBillCopy from "./billing/pages/CustomerBillCopy";
import CustomerBillForm from "./billing/pages/CustomerBillingForm";
import Hotel from "../public/factory.png";
import Login from "./login/Login";
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { BranchProvider } from "./context/BranchContext";
import Loading from "./utils/Loading";
import Settings from "./components/pages/Settings";
// import master from "./components/assets/cloud.png";
const routeModules = import.meta.glob("./*/AppRoutes.jsx", { eager: true });

const moduleIcons = {
Hotel: <img src={Hotel} alt="company" className="w-7 h-9" />,
  // HMS: <img src={HMS} alt="HMS" className="w-7 h-9" />,
  dashboard: <img src={dashboard} alt="iot" className="w-6 h-6" />,
  // hrms: <img src={hrms} alt="iot" className="w-6 h-6 " />,

  // master: <img src={master} alt="master" className="w-7 h-9" />,
};
const App = () => {
  const modules = Object.entries(routeModules).map(([path, mod]) => {
    const match = path.match(/\.\/(.*?)\/AppRoutes\.jsx$/);
    const name = match?.[1];

    return {
      name,
      path: `/${name}/*`,
      element: mod.default,
      menuItems: mod[`${name}MenuItems`] || [],
    };
  });

  const menuItems = useMemo(() => {
    const items = modules.map(({ name, menuItems }) => ({
      key: name,
      icon: moduleIcons[name] || null,
      label: name.toUpperCase(),
      children: menuItems,
    }));
    console.log('App.jsx modules:', modules);
    console.log('App.jsx menuItems:', items);
    return items;
  }, [modules]);

  const getDefaultRedirect = () => {
    const filteredModules = modules.filter((mod) => mod.name !== "dashboard");
    return filteredModules.length > 0
      ? `/${filteredModules[0].name}/pages/dashboard`
      : "/404";
  };

  return (
    <BrowserRouter>
  <AuthProvider>
    <BranchProvider>
      <Loading duration={3000} />
      <Suspense fallback={<div className="p-4"><Loading /></div>}>
        <Routes>
          {/* Public/Login routes */}
          <Route path="/" element={<Login />} />

          {/* Routes WITHOUT sidebar/header */}
          <Route
            path="/billing/customer-copy"
            element={
              <ProtectedRoute>
                <CustomerBillCopy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/customer-add"
            element={
              <ProtectedRoute>
                <CustomerBillForm />
              </ProtectedRoute>
            }
          />

          {/* Routes WITH sidebar/header */}
          <Route element={<MainLayout menuItems={menuItems} />}>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

            {modules.map(({ name, path, element: Element }) => (
              <Route
                key={name}
                path={path}
                element={
                  <ProtectedRoute>
                    <Element />
                  </ProtectedRoute>
                }
              />
            ))}

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<div className="p-4 text-red-500">404 - Page Not Found</div>}
            />
          </Route>
        </Routes>
      </Suspense>
    </BranchProvider>
  </AuthProvider>
</BrowserRouter>


  );
};

export default App;
