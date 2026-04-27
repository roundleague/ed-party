import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HostScreen from './routes/HostScreen';
import JoinScreen from './routes/JoinScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/host" element={<HostScreen />} />
        <Route path="/join" element={<JoinScreen />} />
        {/* Default: redirect / to /host (TV) or /join depending on screen size */}
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function DefaultRedirect() {
  // Simple heuristic: small screen → /join, large → /host
  const isMobile = window.innerWidth < 768;
  return <Navigate to={isMobile ? '/join' : '/host'} replace />;
}
