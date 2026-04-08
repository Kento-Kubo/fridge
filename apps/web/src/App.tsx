import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedLayout } from "./components/ProtectedLayout";
import CollectionPage from "./pages/CollectionPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import MovementDetailPage from "./pages/MovementDetailPage";
import MovementsPage from "./pages/MovementsPage";
import LoginPage from "./pages/LoginPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/items/:itemId" element={<ItemDetailPage />} />
          <Route path="/movements" element={<MovementsPage />} />
          <Route path="/movements/:movementId" element={<MovementDetailPage />} />
          <Route path="/transactions" element={<Navigate to="/movements" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
