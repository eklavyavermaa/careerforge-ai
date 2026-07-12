import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/layout/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

import Dashboard from '@/pages/dashboard/Dashboard';

import ResumeList from '@/pages/resumes/ResumeList';
import ResumeDetail from '@/pages/resumes/ResumeDetail';
import AnalysisDetail from '@/pages/analysis/AnalysisDetail';

import CoverLetterList from '@/pages/coverLetters/CoverLetterList';
import CoverLetterDetail from '@/pages/coverLetters/CoverLetterDetail';

import InterviewList from '@/pages/interviews/InterviewList';
import InterviewSession from '@/pages/interviews/InterviewSession';

import RoadmapList from '@/pages/roadmaps/RoadmapList';
import RoadmapDetail from '@/pages/roadmaps/RoadmapDetail';

import ApplicationTracker from '@/pages/applications/ApplicationTracker';

import Profile from '@/pages/profile/Profile';
import Settings from '@/pages/settings/Settings';

import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Verify-email is reachable whether or not the user is currently logged in */}
        <Route element={<AuthLayout />}>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/resumes" element={<ResumeList />} />
            <Route path="/resumes/:id" element={<ResumeDetail />} />
            <Route path="/analysis/:id" element={<AnalysisDetail />} />

            <Route path="/cover-letters" element={<CoverLetterList />} />
            <Route path="/cover-letters/:id" element={<CoverLetterDetail />} />

            <Route path="/interviews" element={<InterviewList />} />
            <Route path="/interviews/:id" element={<InterviewSession />} />

            <Route path="/roadmaps" element={<RoadmapList />} />
            <Route path="/roadmaps/:id" element={<RoadmapDetail />} />

            <Route path="/applications" element={<ApplicationTracker />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
