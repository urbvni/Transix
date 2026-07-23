import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Placeholder from './pages/Placeholder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import Transition from './pages/Transition';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import HowItWorks from './pages/HowItWorks';
import Explore from './pages/Explore';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/how" element={<HowItWorks />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/t/:id" element={<Transition />} />
          <Route path="/dj/:id" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Placeholder title="Pagina non trovata" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
