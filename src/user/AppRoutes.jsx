import { Routes, Route } from "react-router-dom";
import UserList from "./pages/UserList";
import UserForm from "./pages/UserForm";
import RoleList from "./pages/RoleList";
import RoleForm from "./pages/RoleForm";
import BranchList from "./pages/BranchList";
import BranchForm from "./pages/BranchForm";

export const userMenuItems = [
  {
    key: "/user/users",
    label: "Users",
    icon: null,
  },
  {
    key: "/user/roles",
    label: "Roles",
    icon: null,
  },
  {
    key: "/user/branches",
    label: "Branches",
    icon: null,
  },
];

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="users" element={<UserList />} />
      <Route path="users/add" element={<UserForm />} />
      <Route path="users/edit/:id" element={<UserForm />} />
      
      <Route path="roles" element={<RoleList />} />
      <Route path="roles/add" element={<RoleForm />} />
      <Route path="roles/edit/:id" element={<RoleForm />} />
      
      <Route path="branches" element={<BranchList />} />
      <Route path="branches/add" element={<BranchForm />} />
      <Route path="branches/edit/:id" element={<BranchForm />} />
    </Routes>
  );
};

export default UserRoutes;
