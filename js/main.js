/**
 * Obsidian Chess - Main Application Coordinator (Classic Global Script)
 */

class ObsidianChessApp {
    constructor() {
        // Core Chess engines & libraries using global window declarations
        this.chess = new window.Chess();
        this.boardUI = null;
        this.ai = new window.ChessAI({ difficulty: 3 });
        this.multiplayer = null;

        // Game Configuration States
        this.gameMode = 'local'; // 'local', 'ai', 'online'
        this.myColor = 'w';       // 'w' or 'b'
        this.aiColor = 'b';       // Computer color
        this.isAiThinking = false;
        
        // P2P setup flag — suppresses network messages during initial handshake
        this._isP2PSetup = false;
        // P2P connection established flag
        this._p2pConnected = false;
        
        // Turn timers (10 minutes standard)
        this.timers = {
            w: 600,
            b: 600,
            active: false,
            interval: null
        };

        // Promotion interception
        this.pendingPromo = null; // Stores { src, dest }

        // Start App
        this.init();
    }

    init() {
        // Initialize Board UI using global ChessboardUI
        const boardEl = document.getElementById('chessboard');
        this.boardUI = new window.ChessboardUI(boardEl, {
            onMoveAttempt: (src, dest) => this.handleMoveAttempt(src, dest),
            getLegalMoves: (src) => this.getLegalMoves(src)
        });

        // Initialize state
        this.boardUI.updatePosition(this.chess.board());
        this.setupDomEvents();
        this.parseUrlRoom();
        
        // Initial plates update
        this.updatePlayerCards();
        this.updateMaterialAdvantage();
    }

    /* ==========================================================================
       Chess Rules & Move Handling
       ========================================================================== */

    /**
     * Callback from boardUI: provides list of legal moves for clicked piece.
     */
    getLegalMoves(sourceSquare) {
        const moves = this.chess.moves({
            square: sourceSquare,
            verbose: true
        });
        return moves.map(m => m.to);
    }

    /**
     * Callback from boardUI when player drags or clicks a move.
     */
    handleMoveAttempt(src, dest) {
        // Validate it's the correct turn in Online mode
        if (this.gameMode === 'online') {
            if (this.chess.turn() !== this.myColor) return;
        }

        // Intercept Pawn Promotion
        const piece = this.chess.get(src);
        if (piece && piece.type === 'p') {
            const isPromoRank = (piece.color === 'w' && dest[1] === '8') || (piece.color === 'b' && dest[1] === '1');
            if (isPromoRank) {
                const moves = this.chess.moves({ square: src, verbose: true });
                const isLegal = moves.some(m => m.to === dest);
                
                if (isLegal) {
                    this.pendingPromo = { src, dest };
                    this.openPromotionModal();
                    return;
                }
            }
        }

        this.executeMove(src, dest);
    }

    /**
     * Executes chess move in logic & visual UI
     */
    executeMove(src, dest, promotionPiece = null) {
        const moveDetails = {
            from: src,
            to: dest
        };
        if (promotionPiece) {
            moveDetails.promotion = promotionPiece;
        }

        const move = this.chess.move(moveDetails);
        if (!move) return; // Illegal move

        // Triggers WebRTC sync in multiplayer
        if (this.gameMode === 'online' && move.color === this.myColor) {
            this.multiplayer.send({
                type: 'MOVE',
                move: { from: src, to: dest, promotion: promotionPiece }
            });
        }

        // Update highlights and render
        this.boardUI.updatePosition(this.chess.board());
        this.boardUI.clearHighlights(['last-move-highlight']);
        this.boardUI.getSquareEl(src).classList.add('last-move-highlight');
        this.boardUI.getSquareEl(dest).classList.add('last-move-highlight');

        // Check Highlight
        if (this.chess.in_check()) {
            const activeColor = this.chess.turn();
            const kingCoord = this.findKing(activeColor);
            this.boardUI.setCheck(kingCoord);
        } else {
            this.boardUI.setCheck(null);
        }

        // SFX Synthesis using global window.sounds
        if (move.captured) {
            if (window.sounds) window.sounds.playCapture();
        } else if (!this.chess.in_check()) {
            if (window.sounds) window.sounds.playMove();
        }

        // Update Log history & Captured Panels
        this.updateMoveLog();
        this.updateCapturedDocks();
        this.updateMaterialAdvantage();

        // Check Game Ending Conditions
        if (this.chess.game_over()) {
            this.handleGameOver();
            return;
        }

        // Toggle clock timers
        this.startTimerCountdown();
        this.updatePlayerCards();

        // AI Response Loop
        if (this.gameMode === 'ai' && this.chess.turn() === this.aiColor) {
            this.triggerAiTurn();
        }
    }

    /**
     * Triggers the computer opponent thinking cycles.
     */
    triggerAiTurn() {
        this.isAiThinking = true;
        this.boardUI.setInteractive(false);
        document.getElementById('thinkingOverlay').classList.remove('hidden');

        this.ai.getBestMove(this.chess).then(aiMove => {
            document.getElementById('thinkingOverlay').classList.add('hidden');
            this.isAiThinking = false;
            this.boardUI.setInteractive(true);

            if (aiMove) {
                this.boardUI.animateAndMove(aiMove.from, aiMove.to, this.chess.board(), () => {
                    this.executeMove(aiMove.from, aiMove.to, aiMove.promotion);
                });
            }
        });
    }

    /**
     * Locate the King's algebraic square (for check indicators).
     */
    findKing(color) {
        const board = this.chess.board();
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (piece && piece.type === 'k' && piece.color === color) {
                    return this.boardUI.indicesToCoord(r, f);
                }
            }
        }
        return null;
    }

    /* ==========================================================================
       Pawn Promotion Modal Logic
       ========================================================================== */

    openPromotionModal() {
        const turnColor = this.chess.turn(); // 'w' or 'b'
        const choices = {
            q: turnColor + 'Q',
            r: turnColor + 'R',
            b: turnColor + 'B',
            n: turnColor + 'N'
        };
        for (const [type, pieceKey] of Object.entries(choices)) {
            const el = document.querySelector(`.promo-choice-btn[data-piece="${type}"] .promo-piece`);
            if (el && window.PIECE_SVGS && window.PIECE_SVGS[pieceKey]) {
                el.innerHTML = window.PIECE_SVGS[pieceKey];
                const innerSvg = el.querySelector('svg');
                if (innerSvg) {
                    innerSvg.style.width = '100%';
                    innerSvg.style.height = '100%';
                }
            }
        }
        document.getElementById('promotionOverlay').classList.remove('hidden');
    }

    closePromotionModal() {
        document.getElementById('promotionOverlay').classList.add('hidden');
        this.pendingPromo = null;
    }

    selectPromotion(pieceType) {
        if (this.pendingPromo) {
            this.executeMove(this.pendingPromo.src, this.pendingPromo.dest, pieceType);
        }
        this.closePromotionModal();
    }

    /* ==========================================================================
       Captured Pieces & Point Differentials
       ========================================================================== */

    updateCapturedDocks() {
        const docks = {
            w: document.getElementById('capturedByPlayer'), 
            b: document.getElementById('capturedByOpponent') 
        };
        
        if (!docks.w || !docks.b) return;

        docks.w.innerHTML = '';
        docks.b.innerHTML = '';

        const startingAssets = {
            w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
            b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
        };

        const activeAssets = {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
        };

        const board = this.chess.board();
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (piece && piece.type !== 'k') {
                    activeAssets[piece.color][piece.type]++;
                }
            }
        }

        const colors = ['w', 'b'];
        const typesOrder = ['q', 'r', 'b', 'n', 'p']; 

        colors.forEach(color => {
            const opponentColor = color === 'w' ? 'b' : 'w';
            const dock = color === 'w' ? docks.w : docks.b;

            typesOrder.forEach(type => {
                const diff = startingAssets[opponentColor][type] - activeAssets[opponentColor][type];
                for (let i = 0; i < diff; i++) {
                    const el = document.createElement('div');
                    el.className = 'captured-piece';
                    el.style.width = '18px';
                    el.style.height = '18px';
                    
                    const pieceKey = opponentColor + type.toUpperCase();
                    if (window.PIECE_SVGS && window.PIECE_SVGS[pieceKey]) {
                        el.innerHTML = window.PIECE_SVGS[pieceKey];
                        const innerSvg = el.querySelector('svg');
                        if (innerSvg) {
                            innerSvg.style.width = '100%';
                            innerSvg.style.height = '100%';
                        }
                    } else {
                        el.innerHTML = `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${this.getMiniSvgPath(pieceKey)}</svg>`;
                    }
                    dock.appendChild(el);
                }
            });
        });
    }

    getMiniSvgPath(pieceKey) {
        const paths = {
            wP: `<path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.65-1.41 1.63-1.41 2.75 0 2.21 4.29 4 9.5 4s9.5-1.79 9.5-4c0-1.12-.58-2.1-1.41-2.75C36.06 24.84 37 23.03 37 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5"/>`,
            wN: `<path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 13,31 C 13,31 15,30 18,27 C 21,24 23,24 25,27 C 27,30 25,32 25,32 C 25,32 28,30 29,27 C 30,24 29,22 28,20 C 28,20 31,20 32,17 C 33,14 31,11 28,10 C 25,9 22,10 22,10 z" fill="#fff" stroke="#000" stroke-width="1.5"/>`,
            wB: `<path d="M15 32c2.5 1.63 5 2 7.5 2s5-.37 7.5-2c-2.5-4.04-5-10.23-5-16.73 0-2.21-1.12-4-2.5-4s-2.5 1.79-2.5 4c0 6.5-2.5 12.69-5 16.73z" fill="#fff" stroke="#000" stroke-width="1.5"/>`,
            wR: `<path d="M12 12V9h4v3h5V9h4v3h5V9h4v3h3v5H9v-5h3z" fill="#fff" stroke="#000" stroke-width="1.5"/>`,
            wQ: `<path d="M6 17c2.5 5.5 5 11 7.5 17h18c2.5-6 5-11.5 7.5-17H6z" fill="#fff" stroke="#000" stroke-width="1.5"/>`,
            bP: `<path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.65-1.41 1.63-1.41 2.75 0 2.21 4.29 4 9.5 4s9.5-1.79 9.5-4c0-1.12-.58-2.1-1.41-2.75C36.06 24.84 37 23.03 37 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#555" stroke="#fff" stroke-width="1.5"/>`,
            bN: `<path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 13,31 C 13,31 15,30 18,27 C 21,24 23,24 25,27 C 27,30 25,32 25,32 C 25,32 28,30 29,27 C 30,24 29,22 28,20 C 28,20 31,20 32,17 C 33,14 31,11 28,10 C 25,9 22,10 22,10 z" fill="#555" stroke="#fff" stroke-width="1.5"/>`,
            bB: `<path d="M15 32c2.5 1.63 5 2 7.5 2s5-.37 7.5-2c-2.5-4.04-5-10.23-5-16.73 0-2.21-1.12-4-2.5-4s-2.5 1.79-2.5 4c0 6.5-2.5 12.69-5 16.73z" fill="#555" stroke="#fff" stroke-width="1.5"/>`,
            bR: `<path d="M12 12V9h4v3h5V9h4v3h5V9h4v3h3v5H9v-5h3z" fill="#555" stroke="#fff" stroke-width="1.5"/>`,
            bQ: `<path d="M6 17c2.5 5.5 5 11 7.5 17h18c2.5-6 5-11.5 7.5-17H6z" fill="#555" stroke="#fff" stroke-width="1.5"/>`
        };
        return paths[pieceKey] || '';
    }

    /**
     * Summarize material totals and render differentials (e.g. White +3)
     */
    updateMaterialAdvantage() {
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        let whiteSum = 0;
        let blackSum = 0;

        const board = this.chess.board();
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = board[r][f];
                if (piece) {
                    const score = values[piece.type];
                    if (piece.color === 'w') whiteSum += score;
                    else blackSum += score;
                }
            }
        }

        const container = document.getElementById('materialAdvantage');
        const whiteBadge = document.getElementById('capturedByPlayer');
        const blackBadge = document.getElementById('capturedByOpponent');

        const prevBadges = document.querySelectorAll('.material-diff');
        prevBadges.forEach(el => el.remove());

        if (whiteSum === blackSum) {
            container.innerText = "Even Material";
        } else if (whiteSum > blackSum) {
            const diff = whiteSum - blackSum;
            container.innerText = `White +${diff}`;
            
            const badge = document.createElement('span');
            badge.className = 'material-diff';
            badge.innerText = `+${diff}`;
            whiteBadge.appendChild(badge);
        } else {
            const diff = blackSum - whiteSum;
            container.innerText = `Black +${diff}`;

            const badge = document.createElement('span');
            badge.className = 'material-diff';
            badge.innerText = `+${diff}`;
            blackBadge.appendChild(badge);
        }
    }

    /* ==========================================================================
       Timers & Game Clock Logic
       ========================================================================== */

    startTimerCountdown() {
        if (this.timers.interval) clearInterval(this.timers.interval);
        
        document.getElementById('playerTimer').classList.remove('hidden');
        document.getElementById('opponentTimer').classList.remove('hidden');

        this.timers.interval = setInterval(() => {
            const turn = this.chess.turn();
            this.timers[turn]--;

            this.updateClockDisplays();

            if (this.timers[turn] <= 0) {
                clearInterval(this.timers.interval);
                this.handleTimeout(turn);
            }
        }, 1000);
    }

    updateClockDisplays() {
        const colors = ['w', 'b'];
        colors.forEach(color => {
            const time = this.timers[color];
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            const displayStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const isOpponent = color !== this.myColor;
            const timerEl = isOpponent 
                ? document.getElementById('opponentTimer') 
                : document.getElementById('playerTimer');
            
            if (timerEl) {
                timerEl.innerText = displayStr;
                
                if (time < 30) {
                    timerEl.classList.add('low-time');
                } else {
                    timerEl.classList.remove('low-time');
                }
            }
        });
    }

    handleTimeout(losingColor) {
        this.boardUI.setInteractive(false);
        const winningColor = losingColor === 'w' ? 'Black' : 'White';
        
        if (window.sounds) window.sounds.playGameOver(winningColor[0].toLowerCase() === this.myColor);
        
        this.openGameOverModal(
            "Timeout!",
            `${winningColor} wins the match on time.`
        );
    }

    stopClocks() {
        if (this.timers.interval) {
            clearInterval(this.timers.interval);
        }
        document.getElementById('playerTimer').classList.add('hidden');
        document.getElementById('opponentTimer').classList.add('hidden');
    }

    /* ==========================================================================
       History Move Logs Panel
       ========================================================================== */

    updateMoveLog() {
        const container = document.getElementById('moveList');
        if (!container) return;

        const history = this.chess.history({ verbose: true });
        if (history.length === 0) {
            container.innerHTML = `<div class="empty-state">No moves logged yet. Make a move to start the game!</div>`;
            return;
        }

        container.innerHTML = '';

        for (let i = 0; i < history.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const whiteMove = history[i];
            const blackMove = history[i + 1];

            const row = document.createElement('div');
            row.className = 'move-row';

            const numSpan = document.createElement('span');
            numSpan.className = 'move-num';
            numSpan.innerText = `${moveNum}.`;
            row.appendChild(numSpan);

            const wSpan = document.createElement('span');
            wSpan.className = 'move-notation';
            wSpan.innerText = whiteMove.san;
            row.appendChild(wSpan);

            if (blackMove) {
                const bSpan = document.createElement('span');
                bSpan.className = 'move-notation';
                bSpan.innerText = blackMove.san;
                row.appendChild(bSpan);
            }

            container.appendChild(row);
        }
        
        container.scrollTop = container.scrollHeight;
    }

    /* ==========================================================================
       Game Over Modal Events
       ========================================================================== */

    handleGameOver() {
        this.boardUI.setInteractive(false);
        this.stopClocks();

        let title = "Game Over";
        let message = "";
        let winColor = null;

        if (this.chess.in_checkmate()) {
            title = "Checkmate!";
            const loser = this.chess.turn();
            winColor = loser === 'w' ? 'b' : 'w';
            const winnerName = winColor === 'w' ? 'White' : 'Black';
            message = `${winnerName} wins the match by checkmate.`;
        } else if (this.chess.in_stalemate()) {
            title = "Stalemate!";
            message = "The match ended in a draw by stalemate.";
        } else if (this.chess.in_threefold_repetition()) {
            title = "Threefold Repetition!";
            message = "Draw due to three-fold board repetition.";
        } else if (this.chess.insufficient_material()) {
            title = "Insufficient Material!";
            message = "Draw due to insufficient mating material.";
        } else {
            title = "Draw!";
            message = "The match ended in a draw.";
        }

        const isVictory = winColor && winColor === this.myColor;
        if (window.sounds) window.sounds.playGameOver(isVictory);

        this.openGameOverModal(title, message);
    }

    openGameOverModal(title, message) {
        document.getElementById('gameOverTitle').innerText = title;
        document.getElementById('gameOverText').innerText = message;
        document.getElementById('totalMovesCount').innerText = this.chess.history().length;
        
        const elapsedSecs = 1200 - (this.timers.w + this.timers.b);
        const mins = Math.floor(elapsedSecs / 60);
        const secs = elapsedSecs % 60;
        document.getElementById('gameDurationTime').innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }

    closeGameOverModal() {
        document.getElementById('gameOverOverlay').classList.add('hidden');
    }

    /* ==========================================================================
       Dashboard Sidebar Updates
       ========================================================================== */

    updatePlayerCards() {
        const pCard = document.getElementById('playerCard');
        const oCard = document.getElementById('opponentCard');
        const pName = document.getElementById('playerName');
        const oName = document.getElementById('opponentName');
        const oSub = document.getElementById('opponentSub');
        const oAvatar = document.getElementById('opponentAvatar');

        const activeTurn = this.chess.turn();

        pCard.classList.remove('active-turn');
        oCard.classList.remove('active-turn');

        if (activeTurn === this.myColor) {
            pCard.classList.add('active-turn');
        } else {
            oCard.classList.add('active-turn');
        }

        if (this.gameMode === 'local') {
            pName.innerText = "White Player";
            oName.innerText = "Black Player";
            oSub.innerText = "Challenger Pass-and-Play";
            oAvatar.innerHTML = `<i class="fa-solid fa-people-arrows"></i>`;
            
            this.myColor = activeTurn;
            this.boardUI.playerColor = activeTurn;
        } else if (this.gameMode === 'ai') {
            pName.innerText = "Challenger (You)";
            oName.innerText = "Computer AI";
            
            const diffTitles = ["Beginner", "Casual", "Intermediate", "Advanced", "Grandmaster"];
            const diffElos = ["800 ELO", "1200 ELO", "1600 ELO", "2000 ELO", "2800+ ELO"];
            const currentLevel = this.ai.difficulty;

            oSub.innerText = `Level ${currentLevel}: ${diffTitles[currentLevel - 1]} (${diffElos[currentLevel - 1]})`;
            oAvatar.innerHTML = `<i class="fa-solid fa-robot"></i>`;
        } else if (this.gameMode === 'online') {
            pName.innerText = this.myColor === 'w' ? "Host (You)" : "Guest (You)";
            oName.innerText = this.myColor === 'w' ? "Guest Player" : "Host Player";
            oSub.innerText = "Connected via WebRTC";
            oAvatar.innerHTML = `<i class="fa-solid fa-user-astronaut"></i>`;
        }
    }

    /* ==========================================================================
       Match Control Actions (Undo / Reset)
       ========================================================================== */

    undoMove() {
        if (this.isAiThinking) return;

        if (this.gameMode === 'local') {
            this.chess.undo();
            this.boardUI.updatePosition(this.chess.board());
            if (window.sounds) window.sounds.playMove();
        } else if (this.gameMode === 'ai') {
            this.chess.undo();
            this.chess.undo();
            this.boardUI.updatePosition(this.chess.board());
            if (window.sounds) window.sounds.playMove();
        } else if (this.gameMode === 'online') {
            this.multiplayer.send({ type: 'UNDO_REQUEST' });
            this.addSystemChatMessage("Sent undo request to opponent...");
        }

        this.updateMoveLog();
        this.updateCapturedDocks();
        this.updateMaterialAdvantage();
        this.updatePlayerCards();
        this.updateUndoButtonState();
        
        this.boardUI.setCheck(null);
    }

    resetMatch() {
        this.chess.reset();
        this.boardUI.updatePosition(this.chess.board());
        this.boardUI.clearHighlights(['last-move-highlight', 'check-highlight', 'selected-piece']);
        
        this.timers.w = 600;
        this.timers.b = 600;
        
        if (this.timers.interval) {
            clearInterval(this.timers.interval);
            this.timers.interval = null;
        }

        document.getElementById('playerTimer').classList.add('hidden');
        document.getElementById('opponentTimer').classList.add('hidden');

        this.updateMoveLog();
        this.updateCapturedDocks();
        this.updateMaterialAdvantage();
        this.updatePlayerCards();
        this.updateUndoButtonState();
        this.closeGameOverModal();

        // Only send reset request if we're in online mode AND it's NOT during
        // the initial P2P handshake setup (which would cause a confirm dialog loop)
        if (this.gameMode === 'online' && !this._isP2PSetup) {
            this.multiplayer.send({ type: 'RESET_REQUEST' });
            this.addSystemChatMessage("Requesting match restart...");
        } else if (this.gameMode !== 'online') {
            if (window.sounds) window.sounds.playMove();
        }
    }

    updateUndoButtonState() {
        const btn = document.getElementById('undoBtn');
        const logLength = this.chess.history().length;
        
        if (this.gameMode === 'online') {
            btn.disabled = logLength === 0;
        } else {
            const minMoves = this.gameMode === 'ai' ? 2 : 1;
            btn.disabled = logLength < minMoves;
        }
    }

    /* ==========================================================================
       P2P Multiplayer WebRTC Handling
       ========================================================================== */

    setupMultiplayerManager() {
        if (this.multiplayer) return;

        // Instantiating standard P2PMultiplayerManager global
        this.multiplayer = new window.P2PMultiplayerManager({
            onConnectionEstablished: (isHost) => this.handleP2PConnection(isHost),
            onDataReceived: (data) => this.handleP2PMessage(data),
            onConnectionClosed: () => this.handleP2PDisconnect(),
            onStatusChange: (status, info) => this.handleP2PStatusUpdate(status, info)
        });
    }

    handleP2PConnection(isHost) {
        this._p2pConnected = true;
        document.getElementById('chatTabHeader').classList.remove('hidden');
        this.addSystemChatMessage("Online connection secure. Chat enabled.");
        
        // Suppress outgoing reset/network messages during initial setup
        this._isP2PSetup = true;
        
        if (isHost) {
            this.myColor = 'w';
            this.boardUI.setPerspective('w');
            this.addSystemChatMessage("Host designated as White. Guest is Black.");
        } else {
            this.addSystemChatMessage("Waiting for color assignment...");
        }

        this.resetMatch();
        this.startTimerCountdown();
        this.updatePlayerCards();
        
        // Re-enable setup flag so future resets work normally
        this._isP2PSetup = false;
        
        // Now send color assignment AFTER the reset, so the guest receives it cleanly
        if (isHost) {
            this.multiplayer.send({ type: 'COLOR_ASSIGN', color: 'b' });
        }
        
        // Enable board interactivity — host plays first (white)
        this.boardUI.setInteractive(true);
        
        document.getElementById('roomShareBox').classList.add('hidden');
    }

    handleP2PMessage(data) {
        switch (data.type) {
            case 'COLOR_ASSIGN':
                this.myColor = data.color;
                this.boardUI.playerColor = data.color;
                this.boardUI.setPerspective(data.color);
                this.addSystemChatMessage(`You play as ${data.color === 'w' ? 'White' : 'Black'}.`);
                this.updatePlayerCards();
                // Enable board interactivity now that color is assigned
                this.boardUI.setInteractive(true);
                break;

            case 'MOVE':
                this.boardUI.animateAndMove(data.move.from, data.move.to, this.chess.board(), () => {
                    this.executeMove(data.move.from, data.move.to, data.move.promotion);
                    this.boardUI.setInteractive(true);
                });
                break;

            case 'CHAT':
                this.addChatMessage(data.sender, data.text, 'received');
                break;

            case 'UNDO_REQUEST':
                if (confirm("Opponent requests to undo the last move. Approve?")) {
                    this.multiplayer.send({ type: 'UNDO_RESPONSE', approved: true });
                    this.chess.undo();
                    this.boardUI.updatePosition(this.chess.board());
                    this.boardUI.setCheck(null);
                    this.updateMoveLog();
                    this.updateCapturedDocks();
                    this.updateMaterialAdvantage();
                    this.updatePlayerCards();
                    this.updateUndoButtonState();
                    this.addSystemChatMessage("Undo approved.");
                } else {
                    this.multiplayer.send({ type: 'UNDO_RESPONSE', approved: false });
                }
                break;

            case 'UNDO_RESPONSE':
                if (data.approved) {
                    this.chess.undo();
                    this.boardUI.updatePosition(this.chess.board());
                    this.boardUI.setCheck(null);
                    this.updateMoveLog();
                    this.updateCapturedDocks();
                    this.updateMaterialAdvantage();
                    this.updatePlayerCards();
                    this.updateUndoButtonState();
                    this.addSystemChatMessage("Undo approved by opponent.");
                } else {
                    this.addSystemChatMessage("Undo request rejected.");
                }
                break;

            case 'RESET_REQUEST':
                if (confirm("Opponent requests to reset the board. Restart match?")) {
                    this.multiplayer.send({ type: 'RESET_RESPONSE', approved: true });
                    this.resetMatch();
                    this.startTimerCountdown();
                    this.addSystemChatMessage("Match restarted.");
                } else {
                    this.multiplayer.send({ type: 'RESET_RESPONSE', approved: false });
                }
                break;

            case 'RESET_RESPONSE':
                if (data.approved) {
                    this.resetMatch();
                    this.startTimerCountdown();
                    this.addSystemChatMessage("Match restarted by opponent.");
                } else {
                    this.addSystemChatMessage("Restart request rejected.");
                }
                break;

            case 'SYSTEM_MESSAGE':
                this.addSystemChatMessage(data.text);
                break;
        }
    }

    handleP2PDisconnect() {
        this._p2pConnected = false;
        this.addSystemChatMessage("Opponent disconnected from session.");
        this.stopClocks();
        this.boardUI.setInteractive(false);
    }

    handleP2PStatusUpdate(status, info) {
        const badge = document.getElementById('networkStatusBadge');
        const text = badge.querySelector('.status-text');

        badge.className = 'connection-badge';
        text.innerText = info;

        if (status === 'CONNECTED') {
            badge.classList.add('status-connected');
        } else if (status === 'CONNECTING') {
            badge.classList.add('status-connecting');
        } else {
            badge.classList.add('status-disconnected');
        }
    }

    hostOnlineRoom() {
        this.setupMultiplayerManager();
        this.multiplayer.initPeer().then(() => {
            const link = this.multiplayer.getInviteLink();
            const input = document.getElementById('roomLinkInput');
            input.value = link;

            document.getElementById('roomShareBox').classList.remove('hidden');
        });
    }

    parseUrlRoom() {
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('room');
        
        if (roomId) {
            // Set mode with _isP2PSetup flag to prevent sending messages before connection
            this._isP2PSetup = true;
            this.setGameMode('online');
            this._isP2PSetup = false;
            
            this.setupMultiplayerManager();
            this.multiplayer.connectToHost(roomId);
            
            const chatHeader = document.getElementById('chatTabHeader');
            chatHeader.classList.remove('hidden');
            
            this.switchDashboardTab('chat');
            
            this.addSystemChatMessage('Connecting to host...');
        }
    }

    /* ==========================================================================
       UX Dom Coordinators & Event Wire-ups
       ========================================================================== */

    setupDomEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = btn.dataset.tab;
                this.switchDashboardTab(tabId);
            });
        });

        document.getElementById('modeLocalBtn').addEventListener('click', () => this.setGameMode('local'));
        document.getElementById('modeAiBtn').addEventListener('click', () => this.setGameMode('ai'));
        document.getElementById('modeOnlineBtn').addEventListener('click', () => this.setGameMode('online'));

        const diffSlider = document.getElementById('difficultySlider');
        diffSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.ai.setDifficultySkill(val);

            const titles = ["Beginner", "Casual", "Intermediate", "Advanced", "Grandmaster"];
            const elos = ["800 ELO", "1200 ELO", "1600 ELO", "2000 ELO", "2800+ ELO"];
            const descs = [
                "Blunders occasionally. Very short lookahead depth (1-2 moves). Good for training.",
                "Casual club chess. Good positioning, avoids major direct blunders.",
                "Custom 4-depth lookahead evaluation. Balanced opening and board tactics.",
                "Advanced play. Evaluates space, pawn structures, and captures recursively.",
                "World-class Stockfish AI loaded directly in Web Worker thread. Unbeatable ELO 2800+."
            ];

            document.getElementById('diffTitle').innerText = titles[val - 1];
            document.getElementById('diffElo').innerText = elos[val - 1];
            document.getElementById('diffDesc').innerText = descs[val - 1];

            this.updatePlayerCards();
        });

        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm("Reset the match and clear the board?")) {
                this.resetMatch();
            }
        });

        document.getElementById('boardRotateBtn').addEventListener('click', () => {
            this.boardUI.flipBoard();
        });

        document.getElementById('soundToggleBtn').addEventListener('change', (e) => {
            if (window.sounds) window.sounds.toggle(e.target.checked);
        });

        document.querySelectorAll('.promo-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.dataset.piece;
                this.selectPromotion(choice);
            });
        });

        document.getElementById('modalRematchBtn').addEventListener('click', () => {
            this.resetMatch();
            this.closeGameOverModal();
        });
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeGameOverModal());

        document.getElementById('createRoomBtn').addEventListener('click', () => this.hostOnlineRoom());

        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            const input = document.getElementById('roomLinkInput');
            input.select();
            input.setSelectionRange(0, 99999); 
            navigator.clipboard.writeText(input.value);

            const toast = document.getElementById('copyToast');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        });

        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = document.getElementById('themeToggleBtn').querySelector('i');
            if (document.body.classList.contains('light-theme')) {
                icon.className = 'fa-solid fa-sun';
            } else {
                icon.className = 'fa-solid fa-moon';
            }
        });

        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    switchDashboardTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) btn.classList.add('active');
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) targetTab.classList.add('active');
    }

    setGameMode(mode) {
        if (this.gameMode === mode) return;

        if (this.gameMode === 'online' && this.multiplayer) {
            this.multiplayer.destroy();
            this.multiplayer = null;
            document.getElementById('chatTabHeader').classList.add('hidden');
            this.handleP2PStatusUpdate('DISCONNECTED', 'Offline Mode');
        }

        this.gameMode = mode;

        const modes = ['local', 'ai', 'online'];
        modes.forEach(m => {
            const id = 'mode' + m[0].toUpperCase() + m.slice(1) + 'Btn';
            document.getElementById(id).classList.remove('active');
        });
        const activeId = 'mode' + mode[0].toUpperCase() + mode.slice(1) + 'Btn';
        document.getElementById(activeId).classList.add('active');

        const aiConfig = document.getElementById('aiConfigSection');
        const onlineConfig = document.getElementById('onlineConfigSection');

        aiConfig.classList.add('hidden');
        onlineConfig.classList.add('hidden');

        if (mode === 'ai') {
            aiConfig.classList.remove('hidden');
            this.myColor = 'w';
            this.aiColor = 'b';
            this.boardUI.setPerspective('w');
        } else if (mode === 'online') {
            onlineConfig.classList.remove('hidden');
        } else {
            this.myColor = 'w';
            this.boardUI.setPerspective('w');
        }

        this.resetMatch();
    }

    /* ==========================================================================
       Chat Mechanics
       ========================================================================== */

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        const senderName = this.myColor === 'w' ? "White" : "Black";
        this.addChatMessage("You", text, 'sent');
        
        if (this.multiplayer) {
            this.multiplayer.send({
                type: 'CHAT',
                sender: senderName,
                text: text
            });
        }

        input.value = '';
    }

    addChatMessage(sender, text, type) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        
        const safeSender = document.createTextNode(sender);
        const safeText = document.createTextNode(text);
        
        const senderLabel = document.createElement('strong');
        senderLabel.style.display = 'block';
        senderLabel.style.fontSize = '0.65rem';
        senderLabel.style.opacity = '0.7';
        senderLabel.appendChild(safeSender);
        
        bubble.appendChild(senderLabel);
        bubble.appendChild(safeText);
        
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    addSystemChatMessage(text) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const msg = document.createElement('div');
        msg.className = 'system-message';
        msg.appendChild(document.createTextNode(text));

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }
}

// Instantiate App on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ObsidianChessApp();
});
