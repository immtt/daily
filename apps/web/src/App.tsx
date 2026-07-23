import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { DiaryListPage } from "./pages/DiaryListPage";
import { DiaryDetailPage } from "./pages/DiaryDetailPage";
import { DiaryEditPage } from "./pages/DiaryEditPage";
import { TrashListPage } from "./pages/TrashListPage";
import { TrashDetailPage } from "./pages/TrashDetailPage";

function Private({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center pad">加载中…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Private>
            <DiaryListPage />
          </Private>
        }
      />
      <Route
        path="/entries/new"
        element={
          <Private>
            <DiaryEditPage />
          </Private>
        }
      />
      <Route
        path="/entries/:id/edit"
        element={
          <Private>
            <DiaryEditPage />
          </Private>
        }
      />
      <Route
        path="/entries/:id"
        element={
          <Private>
            <DiaryDetailPage />
          </Private>
        }
      />
      <Route
        path="/trash"
        element={
          <Private>
            <TrashListPage />
          </Private>
        }
      />
      <Route
        path="/trash/:id"
        element={
          <Private>
            <TrashDetailPage />
          </Private>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
