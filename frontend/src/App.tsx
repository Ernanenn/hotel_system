import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import Reservation from './pages/Reservation';
import Payment from './pages/Payment';
import MyReservations from './pages/MyReservations';
import ReservationSuccess from './pages/ReservationSuccess';
import Profile from './pages/Profile';
import CheckIn from './pages/CheckIn';
import AdminDashboard from './pages/admin/Dashboard';
import AdminReservations from './pages/admin/Reservations';
import AdminPayments from './pages/admin/Payments';
import AdminRooms from './pages/admin/Rooms';
import Reports from './pages/admin/Reports';
import AdminCoupons from './pages/admin/Coupons';
import AdminHotels from './pages/admin/Hotels';
import AdminCalendar from './pages/admin/Calendar';
import AdminRoomBlocks from './pages/admin/RoomBlocks';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<TermsOfService />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/:id" element={<RoomDetails />} />
        <Route
          path="reservations/new"
          element={
            <ProtectedRoute>
              <Reservation />
            </ProtectedRoute>
          }
        />
        <Route
          path="reservations/:id/checkout"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="reservations/:id/success"
          element={
            <ProtectedRoute>
              <ReservationSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-reservations"
          element={
            <ProtectedRoute>
              <MyReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="reservations/:id/checkin"
          element={
            <ProtectedRoute>
              <CheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reservations"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/payments"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/rooms"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute requiredRole="admin">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/coupons"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCoupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/hotels"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminHotels />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/calendar"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/room-blocks"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRoomBlocks />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

