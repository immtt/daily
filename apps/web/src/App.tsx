import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { isEntryDomain } from "./lib/domain";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { HubPage } from "./pages/HubPage";
import { StockListPage } from "./pages/StockListPage";
import { ReadingListPage } from "./pages/ReadingListPage";
import { LifeListPage } from "./pages/LifeListPage";
import { EntryEditPage } from "./pages/EntryEditPage";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { TrashListPage } from "./pages/TrashListPage";
import { TrashDetailPage } from "./pages/TrashDetailPage";
import { LifeGate } from "./components/LifeGate";
import { LifeAccessWatcher } from "./components/LifeAccessWatcher";

function Private({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center pad">加载中…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LegacyEntryRedirect() {
  const { pathname } = useLocation();
  const path = pathname.replace(/^\/entries/, "/stock");
  return <Navigate to={path} replace />;
}

function DomainEntryEdit() {
  const { domain } = useParams<{ domain: string }>();
  if (!domain || !isEntryDomain(domain)) return <Navigate to="/" replace />;
  const page = <EntryEditPage domain={domain} />;
  if (domain === "life") return <LifeGate>{page}</LifeGate>;
  return page;
}

function DomainEntryDetail() {
  const { domain, id } = useParams<{ domain: string; id: string }>();
  if (!domain || !isEntryDomain(domain) || !id || id === "new") {
    return <Navigate to="/" replace />;
  }
  const page = <EntryDetailPage domain={domain} />;
  if (domain === "life") return <LifeGate>{page}</LifeGate>;
  return page;
}

function LifePrivate({ children }: { children: ReactNode }) {
  return (
    <Private>
      <LifeGate>{children}</LifeGate>
    </Private>
  );
}

export function App() {
  return (
    <>
      <LifeAccessWatcher />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Private>
            <HubPage />
          </Private>
        }
      />
      <Route
        path="/stock"
        element={
          <Private>
            <StockListPage />
          </Private>
        }
      />
      <Route
        path="/reading"
        element={
          <Private>
            <ReadingListPage />
          </Private>
        }
      />
      <Route
        path="/life"
        element={
          <LifePrivate>
            <LifeListPage />
          </LifePrivate>
        }
      />
      <Route
        path="/:domain/new"
        element={
          <Private>
            <DomainEntryEdit />
          </Private>
        }
      />
      <Route
        path="/:domain/:id/edit"
        element={
          <Private>
            <DomainEntryEdit />
          </Private>
        }
      />
      <Route
        path="/:domain/:id"
        element={
          <Private>
            <DomainEntryDetail />
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
      <Route path="/entries/*" element={<LegacyEntryRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
