/**
 * Obsidian Chess - Dual-Engine AI System (Classic Global Script)
 */

// Custom Piece-Square Tables (PSTs) to evaluate positional strengths.
const PST_PAWN = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_KNIGHT = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const PST_BISHOP = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const PST_ROOK = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];

const PST_QUEEN = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  5,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const PST_KING_MID = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];

const PST_KING_END = [
    [-50,-40,-30,-20,-20,-30,-40,-50],
    [-30,-29,-10,  0,  0,-10,-20,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-30,  0,  0,  0,  0,-30,-30],
    [-50,-30,-30,-30,-30,-30,-30,-50]
];

class ChessAI {
    /**
     * @param {Object} options
     * @param {number} options.difficulty - ELO tier 1 to 5 (1=800, 5=2800+)
     */
    constructor(options = {}) {
        this.difficulty = options.difficulty || 3;
        this.stockfishWorker = null;
        this.stockfishReady = false;
        this.transpositionTable = new Map();
        
        this.initStockfish();
    }

    /**
     * Launch Stockfish Web Worker using Blob CORS Bypass.
     */
    initStockfish() {
        // Under file:// protocol, browsers restrict Web Worker creation and CORS requests (blob importScripts).
        // Skip Stockfish worker creation and rely entirely on the high-performance local Minimax engine offline fallback.
        if (window.location.protocol === 'file:') {
            console.info("Obsidian Chess: running under file:// protocol. Using custom Minimax AI engine (Stockfish.js disabled to bypass browser worker security restrictions).");
            this.stockfishReady = false;
            return;
        }

        try {
            const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
            const blobCode = `importScripts("${stockfishUrl}");`;
            const blob = new Blob([blobCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            this.stockfishWorker = new Worker(workerUrl);
            
            // Asynchronous error handler for workers blocked by local security / CSP policies
            this.stockfishWorker.onerror = (e) => {
                console.warn("Stockfish worker error occurred (possibly blocked under local file environment). falling back to local Minimax.", e);
                this.stockfishReady = false;
                if (this.stockfishWorker) {
                    this.stockfishWorker.terminate();
                    this.stockfishWorker = null;
                }
            };

            this.stockfishWorker.postMessage('uci');
            this.stockfishWorker.postMessage('isready');
            
            this.stockfishWorker.onmessage = (e) => {
                const line = e.data;
                if (line.includes('readyok')) {
                    this.stockfishReady = true;
                    this.setDifficultySkill(this.difficulty);
                }
            };
        } catch (err) {
            console.warn("Stockfish.js initialization failed. Falling back to local Minimax.", err);
            this.stockfishReady = false;
        }
    }

    /**
     * Map application difficulty 1-5 to Stockfish skill levels (0-20).
     */
    setDifficultySkill(diffLevel) {
        this.difficulty = diffLevel;
        if (!this.stockfishReady || !this.stockfishWorker) return;

        const skillMap = [0, 4, 10, 15, 20];
        const skill = skillMap[diffLevel - 1];

        this.stockfishWorker.postMessage(`setoption name Skill Level value ${skill}`);
        const errorPercent = (5 - diffLevel) * 20; 
        this.stockfishWorker.postMessage(`setoption name Skill Level Maximum Error value ${errorPercent}`);
    }

    /**
     * Generate the best move for a given position.
     */
    getBestMove(chessInstance) {
        return new Promise((resolve) => {
            const fen = chessInstance.fen();
            const legalMoves = chessInstance.moves({ verbose: true });
            
            if (legalMoves.length === 0) {
                resolve(null);
                return;
            }

            if (this.difficulty === 1 && Math.random() < 0.18) {
                const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                setTimeout(() => resolve(randomMove), 600); 
                return;
            }

            if (this.stockfishReady && this.stockfishWorker) {
                this.getStockfishMove(fen)
                    .then(moveStr => {
                        const parsedMove = this.parseUciMove(moveStr, legalMoves);
                        resolve(parsedMove);
                    })
                    .catch(() => {
                        resolve(this.getMinimaxMove(chessInstance));
                    });
            } else {
                resolve(this.getMinimaxMove(chessInstance));
            }
        });
    }

    /**
     * Send FEN to Stockfish Web Worker and wait for bestmove.
     */
    getStockfishMove(fen) {
        return new Promise((resolve, reject) => {
            if (!this.stockfishWorker) return reject();

            const timeLimits = [300, 600, 1000, 1500, 2500];
            const movetime = timeLimits[this.difficulty - 1];

            this.stockfishWorker.postMessage(`position fen ${fen}`);
            this.stockfishWorker.postMessage(`go movetime ${movetime}`);

            const handler = (e) => {
                const line = e.data;
                if (line.includes('bestmove')) {
                    this.stockfishWorker.removeEventListener('message', handler);
                    const tokens = line.split(' ');
                    resolve(tokens[1]); 
                }
            };
            this.stockfishWorker.addEventListener('message', handler);
        });
    }

    parseUciMove(uciStr, legalMoves) {
        const from = uciStr.substring(0, 2);
        const to = uciStr.substring(2, 4);
        const promo = uciStr.length > 4 ? uciStr[4] : null;

        let matched = legalMoves.find(m => m.from === from && m.to === to && (!promo || m.promotion === promo));
        if (!matched) {
            matched = legalMoves.find(m => m.from === from && m.to === to);
        }
        return matched;
    }

    /* ==========================================================================
       Custom Minimax AI Engine (Fallback)
       ========================================================================== */

    getMinimaxMove(chessInstance) {
        const depth = Math.min(this.difficulty, 4);
        this.transpositionTable.clear(); 
        const color = chessInstance.turn();
        
        let bestMove = null;
        let bestScore = color === 'w' ? -Infinity : Infinity;

        const moves = this.orderMoves(chessInstance, chessInstance.moves({ verbose: true }));
        
        for (const move of moves) {
            chessInstance.move(move);
            const score = this.minimax(chessInstance, depth - 1, -Infinity, Infinity, color === 'b');
            chessInstance.undo();

            if (color === 'w') {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }
        return bestMove || moves[0];
    }

    minimax(chess, depth, alpha, beta, isMaximizing) {
        const fen = chess.fen();
        
        if (this.transpositionTable.has(fen)) {
            const cached = this.transpositionTable.get(fen);
            if (cached.depth >= depth) {
                return cached.score;
            }
        }

        if (depth === 0 || chess.game_over()) {
            const score = this.evaluateBoard(chess);
            this.transpositionTable.set(fen, { score, depth });
            return score;
        }

        let moves = chess.moves({ verbose: true });
        moves = this.orderMoves(chess, moves);

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of moves) {
                chess.move(move);
                const score = this.minimax(chess, depth - 1, alpha, beta, false);
                chess.undo();
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; 
            }
            this.transpositionTable.set(fen, { score: maxScore, depth });
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of moves) {
                chess.move(move);
                const score = this.minimax(chess, depth - 1, alpha, beta, true);
                chess.undo();
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; 
            }
            this.transpositionTable.set(fen, { score: minScore, depth });
            return minScore;
        }
    }

    orderMoves(chess, moves) {
        return moves.map(move => {
            let score = 0;
            const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
            
            if (move.captured) {
                const victimVal = pieceValues[move.captured] || 0;
                const attackerVal = pieceValues[chess.get(move.from).type] || 0;
                score = 1000 + (victimVal * 10) - attackerVal;
            }

            if (move.promotion) {
                score += 800;
            }

            chess.move(move);
            if (chess.in_check()) {
                score += 500;
            }
            chess.undo();

            return { move, score };
        })
        .sort((a, b) => b.score - a.score)
        .map(item => item.move);
    }

    evaluateBoard(chess) {
        if (chess.in_checkmate()) {
            return chess.turn() === 'w' ? -150000 : 150000;
        }
        if (chess.in_draw() || chess.in_threefold_repetition() || chess.in_stalemate()) {
            return 0; 
        }

        let score = 0;
        const board = chess.board();
        
        let totalMaterial = 0;
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (piece && piece.type !== 'k') {
                    totalMaterial += this.getPieceBaseValue(piece.type);
                }
            }
        }
        const isEndgame = totalMaterial < 1500; 

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (!piece) continue;

                let val = this.getPieceBaseValue(piece.type);
                let pstVal = 0;
                const pstRow = piece.color === 'w' ? r : 7 - r;
                const pstCol = piece.color === 'w' ? f : 7 - f;

                switch (piece.type) {
                    case 'p': pstVal = PST_PAWN[pstRow][pstCol]; break;
                    case 'n': pstVal = PST_KNIGHT[pstRow][pstCol]; break;
                    case 'b': pstVal = PST_BISHOP[pstRow][pstCol]; break;
                    case 'r': pstVal = PST_ROOK[pstRow][pstCol]; break;
                    case 'q': pstVal = PST_QUEEN[pstRow][pstCol]; break;
                    case 'k': pstVal = isEndgame ? PST_KING_END[pstRow][pstCol] : PST_KING_MID[pstRow][pstCol]; break;
                }

                const totalVal = val + pstVal;
                if (piece.color === 'w') {
                    score += totalVal;
                } else {
                    score -= totalVal;
                }
            }
        }
        return score;
    }

    getPieceBaseValue(type) {
        switch (type) {
            case 'p': return 100;
            case 'n': return 320;
            case 'b': return 330;
            case 'r': return 500;
            case 'q': return 900;
            case 'k': return 20000;
            default: return 0;
        }
    }
}

// Bind to window global
window.ChessAI = ChessAI;
