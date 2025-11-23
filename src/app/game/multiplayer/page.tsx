import Link from 'next/link';
import MultiplayerChessBoard from '@/components/MultiplayerChessBoard';

export default function MultiplayerGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Play vs Player</h1>
            <p className="text-slate-300">Play chess with another player online</p>
          </div>
          <Link
            href="/"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
        
        <MultiplayerChessBoard />
      </div>
    </div>
  );
}
