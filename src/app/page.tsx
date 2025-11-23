import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <main className="flex flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white">
            Chessr
          </h1>
          <p className="text-xl text-slate-300">
            Play chess with bots or challenge other players online
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Link
            href="/game/bot"
            className="flex h-16 items-center justify-center rounded-lg bg-blue-600 px-8 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            🤖 Play vs Bot
          </Link>
          <Link
            href="/game/multiplayer"
            className="flex h-16 items-center justify-center rounded-lg bg-green-600 px-8 text-lg font-semibold text-white transition-colors hover:bg-green-700"
          >
            👥 Play vs Player
          </Link>
        </div>

        <div className="mt-8 text-sm text-slate-400">
          <p>Choose your game mode to start playing</p>
        </div>
      </main>
    </div>
  );
}
