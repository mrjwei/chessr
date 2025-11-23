'use client';

import { Chessboard } from 'react-chessboard';
import { Chess, Square, Move } from 'chess.js';
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { PieceDropHandlerArgs } from './types';

export default function MultiplayerChessBoard() {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameStatus, setGameStatus] = useState('Finding opponent...');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const updateGameStatus = useCallback(() => {
    if (!gameId) return;

    let status = '';
    
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      status = `Checkmate! ${winner} wins!`;
    } else if (game.isDraw()) {
      status = 'Game over - Draw!';
    } else if (game.isStalemate()) {
      status = 'Game over - Stalemate!';
    } else if (game.isThreefoldRepetition()) {
      status = 'Game over - Threefold repetition!';
    } else if (game.isInsufficientMaterial()) {
      status = 'Game over - Insufficient material!';
    } else if (game.isCheck()) {
      status = 'Check!';
    } else {
      const currentTurn = game.turn() === 'w' ? 'White' : 'Black';
      const isYourTurn = (playerColor === 'white' && game.turn() === 'w') || 
                         (playerColor === 'black' && game.turn() === 'b');
      status = `${currentTurn} to move ${isYourTurn ? '(Your turn)' : '(Opponent\'s turn)'}`;
    }
    
    setGameStatus(status);
  }, [gameId, game, playerColor]);

  useEffect(() => {
    const newSocket = io();

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('find_game');
      setSocket(newSocket);
    });

    newSocket.on('waiting', () => {
      setGameStatus('Waiting for opponent...');
    });

    newSocket.on('game_start', ({ gameId, color }) => {
      console.log('Game started:', gameId, color);
      setGameId(gameId);
      setPlayerColor(color);
      setGameStatus(`Game started! You are playing as ${color}`);
    });

    newSocket.on('opponent_move', ({ move }: { move: Move }) => {
      console.log('Opponent move:', move);
      try {
        const result = game.move(move);
        if (result) {
          setPosition(game.fen());
          setMoveHistory(prev => [...prev, result.san]);
        }
      } catch (err) {
        console.error('Error applying opponent move:', err);
      }
    });

    newSocket.on('opponent_disconnected', () => {
      setGameStatus('Opponent disconnected. Game ended.');
    });

    return () => {
      newSocket.close();
    };
  }, [game]);

  useEffect(() => {
    if (gameId) {
      updateGameStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, gameId]);

  function onDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare) return false;

    // Check if it's player's turn
    const isWhiteTurn = game.turn() === 'w';
    const isPlayerTurn = (playerColor === 'white' && isWhiteTurn) || 
                         (playerColor === 'black' && !isWhiteTurn);

    if (!isPlayerTurn) {
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: 'q',
      });

      if (move === null) return false;

      setPosition(game.fen());
      setMoveHistory(prev => [...prev, move.san]);

      // Send move to server
      if (socket && gameId) {
        socket.emit('make_move', { 
          gameId, 
          move: {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
          }
        });
        socket.emit('update_game', { gameId, fen: game.fen() });
      }

      return true;
    } catch {
      return false;
    }
  }

  if (!gameId) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg text-center">
          <div className="animate-pulse">
            <div className="text-2xl font-semibold text-white mb-4">
              {gameStatus}
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <Chessboard
            options={{
              position: position,
              onPieceDrop: onDrop,
              boardOrientation: playerColor === 'black' ? 'black' : 'white',
            }}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-[600px]">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Game Status</h3>
          <p className="text-slate-300">{gameStatus}</p>
          <p className="text-slate-400 text-sm mt-2">You are playing as: {playerColor}</p>
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
      </div>
    </div>
  );
}
