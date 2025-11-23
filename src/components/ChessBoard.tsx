'use client';

import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { useState, useEffect } from 'react';
import { PieceDropHandlerArgs } from './types';

interface ChessBoardProps {
  mode: 'bot' | 'multiplayer';
  onGameOver?: (result: string) => void;
}

export default function ChessBoard({ mode, onGameOver }: ChessBoardProps) {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const updateGameStatus = () => {
    let status = '';
    
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      status = `Checkmate! ${winner} wins!`;
      onGameOver?.(status);
    } else if (game.isDraw()) {
      status = 'Game over - Draw!';
      onGameOver?.(status);
    } else if (game.isStalemate()) {
      status = 'Game over - Stalemate!';
      onGameOver?.(status);
    } else if (game.isThreefoldRepetition()) {
      status = 'Game over - Threefold repetition!';
      onGameOver?.(status);
    } else if (game.isInsufficientMaterial()) {
      status = 'Game over - Insufficient material!';
      onGameOver?.(status);
    } else if (game.isCheck()) {
      status = 'Check!';
    } else {
      status = `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
    }
    
    setGameStatus(status);
  };

  useEffect(() => {
    updateGameStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  function makeRandomMove() {
    const possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const move = possibleMoves[randomIndex];
    
    try {
      const result = game.move(move);
      if (result) {
        setMoveHistory(prev => [...prev, move]);
      }
      setPosition(game.fen());
    } catch (error) {
      console.error('Error making random move:', error);
    }
  }

  function onDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare) return false;

    try {
      const move = game.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: 'q',
      });

      if (move === null) return false;

      setPosition(game.fen());
      setMoveHistory(prev => [...prev, move.san]);

      // If playing against bot, make bot move after a short delay
      if (mode === 'bot' && !game.isGameOver()) {
        setTimeout(makeRandomMove, 300);
      }

      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    game.reset();
    setPosition(game.fen());
    setMoveHistory([]);
    setGameStatus('');
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <Chessboard
            options={{
              position: position,
              onPieceDrop: onDrop,
            }}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-[600px]">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Game Status</h3>
          <p className="text-slate-300">{gameStatus}</p>
        </div>

        {moveHistory.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-lg max-h-40 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Move History</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              {moveHistory.map((move, index) => (
                <div key={index}>
                  {Math.floor(index / 2) + 1}. {move}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={resetGame}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
