const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active games
const games = new Map();
const waitingPlayers = [];

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('find_game', () => {
      if (waitingPlayers.length > 0) {
        // Match with waiting player
        const opponent = waitingPlayers.shift();
        const gameId = `game_${Date.now()}`;
        
        games.set(gameId, {
          white: opponent.id,
          black: socket.id,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        });

        socket.join(gameId);
        opponent.socket.join(gameId);

        opponent.socket.emit('game_start', {
          gameId,
          color: 'white',
          opponentId: socket.id,
        });

        socket.emit('game_start', {
          gameId,
          color: 'black',
          opponentId: opponent.id,
        });

        console.log(`Game started: ${gameId}`);
      } else {
        // Add to waiting list
        waitingPlayers.push({ id: socket.id, socket });
        socket.emit('waiting');
        console.log(`Player waiting: ${socket.id}`);
      }
    });

    socket.on('make_move', ({ gameId, move }) => {
      const game = games.get(gameId);
      if (game) {
        // Broadcast move to opponent
        socket.to(gameId).emit('opponent_move', { move });
        console.log(`Move made in ${gameId}:`, move);
      }
    });

    socket.on('update_game', ({ gameId, fen }) => {
      const game = games.get(gameId);
      if (game) {
        game.fen = fen;
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from waiting list
      const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
      if (waitingIndex > -1) {
        waitingPlayers.splice(waitingIndex, 1);
      }

      // Notify opponent if in a game
      games.forEach((game, gameId) => {
        if (game.white === socket.id || game.black === socket.id) {
          socket.to(gameId).emit('opponent_disconnected');
          games.delete(gameId);
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
