import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../auth/session";
import { InventoryProvider } from "../lib/InventoryProvider";
import { BottomNav } from "./BottomNav";
import "../App.css";

function ProtectedShell() {
  return (
    <div className="app app--with-bottom-nav">
      <Outlet />
      <BottomNav />
    </div>
  );
}

export function ProtectedLayout() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <InventoryProvider>
      <ProtectedShell />
    </InventoryProvider>
  );
}
