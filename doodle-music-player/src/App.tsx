import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DoodleMusicPlayer from './components/DoodleMusicPlayer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/player" element={<DoodleMusicPlayer />} />
      </Routes>
    </Router>
  );
}

export default App;