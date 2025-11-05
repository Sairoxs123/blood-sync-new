import { Outlet } from "react-router-dom";
import { useAuth } from "./utils/AuthContext";

export const Layout = () => {
  return (
    <div>
      <nav></nav>
      <div>
        <Outlet />
      </div>
    </div>
  );
};
