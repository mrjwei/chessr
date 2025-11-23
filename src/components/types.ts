export type PieceDropHandlerArgs = {
  piece: {
    pieceType: string;
  };
  sourceSquare: string;
  targetSquare: string | null;
};
