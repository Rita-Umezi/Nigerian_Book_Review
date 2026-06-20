import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Explore from './pages/Explore.tsx';
import BookDetails from './pages/BookDetails.tsx';
import AICurator from './pages/AICurator.tsx';
import Leaderboard from './pages/Leaderboard.tsx';
import Profile from './pages/Profile.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#1A1A1A] flex flex-col justify-between antialiased">
          <div>
            {/* Header / Navigation bar */}
            <Navbar />

            {/* Main scroll content */}
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/books" element={<Explore />} />
                <Route path="/books/:id" element={<BookDetails />} />
                <Route path="/recommendations" element={<AICurator />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile/:username" element={<Profile />} />
              </Routes>
            </main>
          </div>

          {/* Sincere descriptive footer */}
          <footer className="bg-[#F5F2ED] border-t border-[#EAE7DE] py-10 mt-16 text-center text-xs text-[#5A5A40]/80">
            <div className="max-w-7xl mx-auto px-4 space-y-4">
              <div className="flex justify-center gap-6 text-[#5A5A40] font-medium">
                <LinkToExternal label="Explore Library" to="/books" />
                <LinkToExternal label="AI curator advisor" to="/recommendations" />
                <LinkToExternal label="Trophy Circle" to="/leaderboard" />
              </div>
              <p className="leading-relaxed max-w-xl mx-auto">
                🇳🇬 Built for the love of Nigerian and African Literature. Track, review, and discuss great stories.
              </p>
              <p className="font-semibold text-[10px] text-[#5A5A40]/50 uppercase tracking-widest">
                NaijaReads Literary Sphere © 2026 • All Rights Reserved
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LinkToExternal({ label, to }: { label: string; to: string }) {
  return (
    <a href={to} className="hover:text-[#C05E42] font-semibold transition-colors">
      {label}
    </a>
  );
}
