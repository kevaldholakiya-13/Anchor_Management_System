import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventsListPage from './pages/EventsListPage';
import SetupPage from './pages/SetupPage';
import LiveDashboardPage from './pages/LiveDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EventsListPage />} />
        <Route path="/setup/:id?" element={<SetupPage />} />
        <Route path="/live/:id?" element={<LiveDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
