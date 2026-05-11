import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore.js';
import useUiStore from './store/uiStore.js';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Public Pages
import Home from './pages/public/Home.jsx';
import Courses from './pages/public/Courses.jsx';
import CourseDetail from './pages/public/CourseDetail.jsx';
import About from './pages/public/About.jsx';
import Contact from './pages/public/Contact.jsx';
import FAQ from './pages/public/FAQ.jsx';
import Pricing from './pages/public/Pricing.jsx';

// Auth Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';

// Student Pages
import StudentDashboard from './pages/student/Dashboard.jsx';
import MyCourses from './pages/student/MyCourses.jsx';
import CourseWatch from './pages/student/CourseWatch.jsx';
import Wishlist from './pages/student/Wishlist.jsx';
import Certificates from './pages/student/Certificates.jsx';
import Notifications from './pages/student/Notifications.jsx';
import StudentProfile from './pages/student/Profile.jsx';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard.jsx';
import CreateCourse from './pages/instructor/CreateCourse.jsx';
import EditCourse from './pages/instructor/EditCourse.jsx';
import CurriculumBuilder from './pages/instructor/CurriculumBuilder.jsx';
import InstructorStudents from './pages/instructor/Students.jsx';
import Earnings from './pages/instructor/Earnings.jsx';
import InstructorAnalytics from './pages/instructor/Analytics.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminCourses from './pages/admin/Courses.jsx';
import AdminCategories from './pages/admin/Categories.jsx';
import AdminRevenue from './pages/admin/Revenue.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { darkMode } = useUiStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Student Routes */}
        <Route element={<ProtectedRoute roles={['student', 'instructor', 'admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<StudentProfile />} />
        </Route>

        {/* Course Watch */}
        <Route path="/learn/:slug" element={<ProtectedRoute roles={['student', 'instructor', 'admin']}><CourseWatch /></ProtectedRoute>} />

        {/* Instructor Routes */}
        <Route element={<ProtectedRoute roles={['instructor', 'admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/courses/create" element={<CreateCourse />} />
          <Route path="/instructor/courses/:id/edit" element={<EditCourse />} />
          <Route path="/instructor/courses/:id/curriculum" element={<CurriculumBuilder />} />
          <Route path="/instructor/students" element={<InstructorStudents />} />
          <Route path="/instructor/earnings" element={<Earnings />} />
          <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
