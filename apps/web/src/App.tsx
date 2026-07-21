import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./features/auth/components/protected-route";
import { AppShell } from "./features/workspaces/components/app-shell";
import { CreateWorkspacePage } from "./features/workspaces/pages/create-workspace-page";
import { WorkspaceOverviewPage } from "./features/workspaces/pages/workspace-overview-page";
import { WorkspaceSettingsPage } from "./features/workspaces/pages/workspace-settings-page";
import { WorkspacesPage } from "./features/workspaces/pages/workspaces-page";
import { DashboardPage } from "./features/auth/pages/dashboard-page";
import { LoginPage } from "./features/auth/pages/login-page";
import { RegisterPage } from "./features/auth/pages/register-page";
import { InvitationPage } from "./features/workspace-collaboration/pages/invitation-page";
import { WorkspaceMembersPage } from "./features/workspace-collaboration/pages/workspace-members-page";
import { WorkspaceInvitationsPage } from "./features/workspace-collaboration/pages/workspace-invitations-page";

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invitations/:token" element={<InvitationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/workspaces" element={<WorkspacesPage />} />

          <Route path="/workspaces/new" element={<CreateWorkspacePage />} />

          <Route
            path="/workspaces/:workspaceId"
            element={<WorkspaceOverviewPage />}
          />

          <Route
            path="/workspaces/:workspaceId/members"
            element={<WorkspaceMembersPage />}
          />

          <Route
            path="/workspaces/:workspaceId/invitations"
            element={<WorkspaceInvitationsPage />}
          />

          <Route
            path="/workspaces/:workspaceId/settings"
            element={<WorkspaceSettingsPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
