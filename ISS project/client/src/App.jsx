import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ParticlesBg from './components/ParticlesBg';
import Header from './components/Header';
import CreateNote from './components/CreateNote';
import ViewNote from './components/ViewNote';

export default function App() {
  return (
    <Router>
      <ParticlesBg />
      <div className="scanlines" />
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<CreateNote />} />
            <Route path="/note/:id" element={<ViewNote />} />
          </Routes>
        </main>
        <footer className="footer">
          <p className="footer__text">
            Phantom Drop &mdash; Zero-Knowledge Encryption &middot; AES-256-GCM &middot; PBKDF2
          </p>
        </footer>
      </div>
    </Router>
  );
}
