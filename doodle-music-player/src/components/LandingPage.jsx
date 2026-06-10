import React from 'react';
import { ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="pt-20 pb-20 px-8 text-center">
        <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
          Doodle Music Player
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Experience music like never before with real-time audio visualization and animated doodles that react to every beat.
        </p>
        
        <a href="/player" className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-700 transition">
          Launch Player <ArrowRight size={24} />
        </a>
      </section>

      {/* Features */}
      <section className="py-20 px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">✨ Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-2xl font-bold mb-2">Real-Time Visualization</h3>
              <p className="text-gray-700">Watch waveforms react to music in real-time</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-2xl font-bold mb-2">Animated Doodles</h3>
              <p className="text-gray-700">Doodles dance and react to every beat</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              <div className="text-4xl mb-4">🎼</div>
              <h3 className="text-2xl font-bold mb-2">Full-Stack App</h3>
              <p className="text-gray-700">React frontend with Node.js backend</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-2">High Performance</h3>
              <p className="text-gray-700">Smooth 60 FPS animations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 text-center text-gray-600">
        <p>Built with ♥️ for music lovers</p>
      </footer>
    </div>
  );
};

export default LandingPage;