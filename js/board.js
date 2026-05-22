/**
 * Obsidian Chess - Interactive 2D Chessboard Controller (Classic Global Script)
 */

// Premium minimalist Chess Piece SVGs inlined for 100% vector scalability and offline speed.
const PIECE_SVGS = {
    wP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.65-1.41 1.63-1.41 2.75 0 2.21 4.29 4 9.5 4s9.5-1.79 9.5-4c0-1.12-.58-2.1-1.41-2.75C36.06 24.84 37 23.03 37 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    wN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 13,31 C 13,31 15,30 18,27 C 21,24 23,24 25,27 C 27,30 25,32 25,32 C 25,32 28,30 29,27 C 30,24 29,22 28,20 C 28,20 31,20 32,17 C 33,14 31,11 28,10 C 25,9 22,10 22,10 z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5 25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" transform="matrix(0.861785,0.507278,-0.507278,0.861785,32.3,-7.4)" fill="#0f172a"/><path d="M20 33c-3 0-6.5-1.5-6.5-1.5v3.5h19v-3.5s-3.5 1.5-6.5 1.5z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    wB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 36c3.39 0 7.66-.69 11.77-2.3 4 1.6 8.35 2.3 11.73 2.3 1.25 0 2.5 1.79 2.5 4H6.5c0-2.21 1.25-4 2.5-4z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><path d="M15 32c2.5 1.63 5 2 7.5 2s5-.37 7.5-2c-2.5-4.04-5-10.23-5-16.73 0-2.21-1.12-4-2.5-4s-2.5 1.79-2.5 4c0 6.5-2.5 12.69-5 16.73z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22.5" cy="7.5" r="2.5" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><path d="M17.5 18h10M22.5 14v8" stroke="#0f172a" stroke-width="1.5"/></svg>`,
    wR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 39h27v-3H9v3zm3-13h21v-4H12v4zm2.5-4l1.5-12h14l1.5 12h-17z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12V9h4v3h5V9h4v3h5V9h4v3h3v5H9v-5h3z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 29.5h17" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    wQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10-3a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10 3a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><path d="M9 37h27v3H9v-3zm3.5-3l1.5-16.5 6 12 3-17.5 3 17.5 6-12 1.5 16.5h-21z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 17c2.5 5.5 5 11 7.5 17h18c2.5-6 5-11.5 7.5-17H6z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    wK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 36.5h28v3h-28v-3zm3-12h22v-4h-22v4zm6-9.5h10v3h-10v-3z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M22.5 15c-3 0-5.5 2-6 5.5s-2 6-5 9.5h22c-3-3.5-4.5-6-5-9.5s-3-5.5-6-5.5z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M22.5 6v6M19.5 9h6" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.65-1.41 1.63-1.41 2.75 0 2.21 4.29 4 9.5 4s9.5-1.79 9.5-4c0-1.12-.58-2.1-1.41-2.75C36.06 24.84 37 23.03 37 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 13,31 C 13,31 15,30 18,27 C 21,24 23,24 25,27 C 27,30 25,32 25,32 C 25,32 28,30 29,27 C 30,24 29,22 28,20 C 28,20 31,20 32,17 C 33,14 31,11 28,10 C 25,9 22,10 22,10 z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5 25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" transform="matrix(0.861785,0.507278,-0.507278,0.861785,32.3,-7.4)" fill="#f8fafc"/><path d="M20 33c-3 0-6.5-1.5-6.5-1.5v3.5h19v-3.5s-3.5 1.5-6.5 1.5z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 36c3.39 0 7.66-.69 11.77-2.3 4 1.6 8.35 2.3 11.73 2.3 1.25 0 2.5 1.79 2.5 4H6.5c0-2.21 1.25-4 2.5-4z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5"/><path d="M15 32c2.5 1.63 5 2 7.5 2s5-.37 7.5-2c-2.5-4.04-5-10.23-5-16.73 0-2.21-1.12-4-2.5-4s-2.5 1.79-2.5 4c0 6.5-2.5 12.69-5 16.73z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22.5" cy="7.5" r="2.5" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5"/><path d="M17.5 18h10M22.5 14v8" stroke="#f8fafc" stroke-width="1.5"/></svg>`,
    bR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 39h27v-3H9v3zm3-13h21v-4H12v4zm2.5-4l1.5-12h14l1.5 12h-17z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12V9h4v3h5V9h4v3h5V9h4v3h3v5H9v-5h3z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 29.5h17" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10-3a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10 3a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5"/><path d="M9 37h27v3H9v-3zm3.5-3l1.5-16.5 6 12 3-17.5 3 17.5 6-12 1.5 16.5h-21z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 17c2.5 5.5 5 11 7.5 17h18c2.5-6 5-11.5 7.5-17H6z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 36.5h28v3h-28v-3zm3-12h22v-4h-22v4zm6-9.5h10v3h-10v-3z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><path d="M22.5 15c-3 0-5.5 2-6 5.5s-2 6-5 9.5h22c-3-3.5-4.5-6-5-9.5s-3-5.5-6-5.5z" fill="#1e293b" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/><path d="M22.5 6v6M19.5 9h6" stroke="#f8fafc" stroke-width="1.5" stroke-linejoin="round"/></svg>`
};

class ChessboardUI {
    /**
     * @param {HTMLElement} boardElement - The chessboard container element
     * @param {Object} options - Configuration options
     * @param {Function} options.onMoveAttempt - Callback when a move is drag-dropped or tapped (srcSquare, destSquare)
     * @param {Function} options.getLegalMoves - Callback returning an array of legal target squares for a source square
     */
    constructor(boardElement, options = {}) {
        this.board = boardElement;
        this.onMoveAttempt = options.onMoveAttempt || (() => {});
        this.getLegalMoves = options.getLegalMoves || (() => []);
        
        this.isFlipped = false;
        this.selectedSquare = null;
        this.legalTargets = [];
        this.interactive = true; 
        this.playerColor = 'w';  
        
        // Touch Drag States
        this.draggedPiece = null;
        this.dragStartSquare = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        this.init();
    }

    init() {
        this.buildSquares();
        this.renderLabels();
        this.setupEventListeners();
    }

    /**
     * Build the 8x8 grid structure.
     */
    buildSquares() {
        this.board.innerHTML = '';
        
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const square = document.createElement('div');
                square.className = `square ${(r + f) % 2 === 0 ? 'light' : 'dark'}`;
                
                // Convert indices to algebraic chess coordinates (A1 to H8)
                const coord = this.indicesToCoord(r, f);
                square.dataset.coord = coord;
                
                this.board.appendChild(square);
            }
        }
    }

    /**
     * Render board border coordinates A-H and 1-8.
     */
    renderLabels() {
        const ranksContainer = document.querySelector('.board-labels.ranks');
        const filesContainer = document.querySelector('.board-labels.files');
        
        if (ranksContainer) {
            ranksContainer.innerHTML = '';
            for (let r = 8; r >= 1; r--) {
                const label = document.createElement('span');
                label.innerText = r;
                ranksContainer.appendChild(label);
            }
        }

        if (filesContainer) {
            filesContainer.innerHTML = '';
            const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            files.forEach(f => {
                const label = document.createElement('span');
                label.innerText = f;
                filesContainer.appendChild(label);
            });
        }
    }

    /**
     * Synchronize the visual board with a chess.js position board.
     * @param {Array<Array>} boardMatrix - 8x8 chess.js board layout
     */
    updatePosition(boardMatrix) {
        this.clearHighlights(['selected-piece', 'valid-move-marker', 'capture-marker']);
        this.selectedSquare = null;
        this.legalTargets = [];

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const coord = this.indicesToCoord(r, f);
                const squareEl = this.getSquareEl(coord);
                if (!squareEl) continue;

                const piece = boardMatrix[r][f];
                if (piece) {
                    const pieceKey = piece.color + piece.type.toUpperCase();
                    let pieceEl = squareEl.querySelector('.piece');
                    
                    if (!pieceEl || pieceEl.dataset.piece !== pieceKey) {
                        squareEl.innerHTML = ''; 
                        pieceEl = document.createElement('div');
                        pieceEl.className = 'piece';
                        pieceEl.dataset.piece = pieceKey;
                        pieceEl.innerHTML = PIECE_SVGS[pieceKey] || '';
                        
                        pieceEl.setAttribute('draggable', 'true');
                        squareEl.appendChild(pieceEl);
                    }
                } else {
                    squareEl.innerHTML = '';
                }
            }
        }
    }

    /**
     * Animate a piece sliding smoothly from source to destination, then execute final callback.
     */
    animateAndMove(src, dest, boardMatrix, callback) {
        const srcEl = this.getSquareEl(src);
        const destEl = this.getSquareEl(dest);
        if (!srcEl || !destEl) {
            callback();
            return;
        }

        const pieceEl = srcEl.querySelector('.piece');
        if (!pieceEl) {
            callback();
            return;
        }

        const srcRect = srcEl.getBoundingClientRect();
        const destRect = destEl.getBoundingClientRect();
        
        const dx = destRect.left - srcRect.left;
        const dy = destRect.top - srcRect.top;

        pieceEl.classList.add('animate-move');
        pieceEl.style.transition = 'transform 280ms cubic-bezier(0.25, 1, 0.5, 1)';
        pieceEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

        const cleanup = () => {
            pieceEl.removeEventListener('transitionend', cleanup);
            pieceEl.classList.remove('animate-move');
            pieceEl.style.transition = '';
            pieceEl.style.transform = '';
            
            this.clearHighlights(['last-move-highlight']);
            srcEl.classList.add('last-move-highlight');
            destEl.classList.add('last-move-highlight');

            callback();
        };

        pieceEl.addEventListener('transitionend', cleanup);
        setTimeout(() => {
            if (pieceEl.classList.contains('animate-move')) {
                cleanup();
            }
        }, 350);
    }

    /**
     * Highlights the King's square if checked.
     */
    setCheck(kingCoord) {
        this.clearHighlights(['check-highlight']);
        if (kingCoord) {
            const kingSquare = this.getSquareEl(kingCoord);
            if (kingSquare) {
                kingSquare.classList.add('check-highlight');
                // Accessing window global sounds
                if (window.sounds) window.sounds.playCheck();
            }
        }
    }

    /**
     * Toggle 180 degree board flip.
     */
    flipBoard() {
        this.isFlipped = !this.isFlipped;
        const wrapper = this.board.closest('.board-wrapper');
        
        if (this.isFlipped) {
            this.board.style.transform = 'rotate(180deg)';
            wrapper.classList.add('flipped');
            this.board.querySelectorAll('.piece').forEach(el => {
                el.style.transform = 'rotate(180deg)';
            });
        } else {
            this.board.style.transform = '';
            wrapper.classList.remove('flipped');
            this.board.querySelectorAll('.piece').forEach(el => {
                el.style.transform = '';
            });
        }
    }

    /**
     * Set explicit board rotation relative to team color.
     */
    setPerspective(color) {
        this.playerColor = color;
        if ((color === 'b' && !this.isFlipped) || (color === 'w' && this.isFlipped)) {
            this.flipBoard();
        }
    }

    /**
     * Set interactive state.
     */
    setInteractive(state) {
        this.interactive = state;
        this.board.querySelectorAll('.piece').forEach(el => {
            if (state) {
                el.setAttribute('draggable', 'true');
                el.style.cursor = 'grab';
            } else {
                el.setAttribute('draggable', 'false');
                el.style.cursor = 'not-allowed';
            }
        });
    }

    showLegalMoves(sourceCoord) {
        this.clearHighlights(['selected-piece', 'valid-move-marker', 'capture-marker']);
        
        const srcSquare = this.getSquareEl(sourceCoord);
        if (!srcSquare) return;

        srcSquare.classList.add('selected-piece');
        this.selectedSquare = sourceCoord;
        
        this.legalTargets = this.getLegalMoves(sourceCoord);

        this.legalTargets.forEach(target => {
            const sqEl = this.getSquareEl(target);
            if (!sqEl) return;

            const hasPiece = sqEl.querySelector('.piece');
            if (hasPiece) {
                const bracket = document.createElement('div');
                bracket.className = 'capture-marker';
                sqEl.appendChild(bracket);
            } else {
                const dot = document.createElement('div');
                dot.className = 'valid-move-marker';
                sqEl.appendChild(dot);
            }
        });
    }

    clearHighlights(classesArray = []) {
        classesArray.forEach(className => {
            this.board.querySelectorAll(`.${className}`).forEach(el => {
                el.classList.remove(className);
            });
            this.board.querySelectorAll('.valid-move-marker, .capture-marker').forEach(el => {
                el.remove();
            });
        });
    }

    setupEventListeners() {
        // 1. Desktop Drag and Drop
        this.board.addEventListener('dragstart', (e) => {
            if (!this.interactive) {
                e.preventDefault();
                return;
            }
            const piece = e.target.closest('.piece');
            if (!piece) return;

            const square = piece.parentElement;
            const coord = square.dataset.coord;
            
            const pieceColor = piece.dataset.piece[0];
            if (pieceColor !== this.playerColor) {
                e.preventDefault();
                return;
            }

            e.dataTransfer.setData('text/plain', coord);
            e.dataTransfer.effectAllowed = 'move';
            
            setTimeout(() => {
                piece.classList.add('dragging');
                this.showLegalMoves(coord);
            }, 0);
        });

        this.board.addEventListener('dragend', (e) => {
            const piece = e.target.closest('.piece');
            if (piece) piece.classList.remove('dragging');
        });

        this.board.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        this.board.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetSquare = e.target.closest('.square');
            if (!targetSquare) return;

            const sourceCoord = e.dataTransfer.getData('text/plain');
            const destCoord = targetSquare.dataset.coord;

            if (sourceCoord && destCoord && sourceCoord !== destCoord) {
                this.onMoveAttempt(sourceCoord, destCoord);
            }
            this.clearHighlights(['selected-piece', 'valid-move-marker', 'capture-marker']);
        });

        // 2. Mobile Touch Event Listeners for seamless Drag on phone screens
        this.board.addEventListener('touchstart', (e) => {
            if (!this.interactive) return;
            const touch = e.touches[0];
            const piece = touch.target.closest('.piece');
            if (!piece) return;

            const square = piece.parentElement;
            const coord = square.dataset.coord;
            
            const pieceColor = piece.dataset.piece[0];
            if (pieceColor !== this.playerColor) return;

            e.preventDefault(); 
            
            this.draggedPiece = piece;
            this.dragStartSquare = square;
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            
            piece.classList.add('dragging');
            this.showLegalMoves(coord);
        }, { passive: false });

        this.board.addEventListener('touchmove', (e) => {
            if (!this.draggedPiece) return;
            e.preventDefault(); 

            const touch = e.touches[0];
            const dx = touch.clientX - this.dragStartX;
            const dy = touch.clientY - this.dragStartY;
            
            const factor = this.isFlipped ? -1 : 1;
            this.draggedPiece.style.transform = `translate3d(${dx * factor}px, ${dy * factor}px, 0) ${this.isFlipped ? 'rotate(180deg)' : ''}`;
        }, { passive: false });

        this.board.addEventListener('touchend', (e) => {
            if (!this.draggedPiece) return;
            e.preventDefault();

            const touch = e.changedTouches[0];
            const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetSquare = targetEl ? targetEl.closest('.square') : null;
            
            const sourceCoord = this.dragStartSquare.dataset.coord;
            const destCoord = targetSquare ? targetSquare.dataset.coord : null;

            this.draggedPiece.classList.remove('dragging');
            this.draggedPiece.style.transform = this.isFlipped ? 'rotate(180deg)' : '';

            if (sourceCoord && destCoord && sourceCoord !== destCoord) {
                this.onMoveAttempt(sourceCoord, destCoord);
            }
            
            this.draggedPiece = null;
            this.dragStartSquare = null;
            this.clearHighlights(['selected-piece', 'valid-move-marker', 'capture-marker']);
        }, { passive: false });

        // 3. Desktop Click-to-Move / Mobile Single-Tap to Move
        this.board.addEventListener('click', (e) => {
            if (!this.interactive) return;
            const square = e.target.closest('.square');
            if (!square) return;

            const coord = square.dataset.coord;
            const piece = square.querySelector('.piece');

            if (this.selectedSquare && this.legalTargets.includes(coord)) {
                this.onMoveAttempt(this.selectedSquare, coord);
                this.clearHighlights(['selected-piece', 'valid-move-marker', 'capture-marker']);
                this.selectedSquare = null;
                this.legalTargets = [];
            }
            else if (piece && piece.dataset.piece[0] === this.playerColor) {
                this.showLegalMoves(coord);
            } 
            else {
                this.clearHighlights(['selected-piece', 'valid-move-marker', 'capture-marker']);
                this.selectedSquare = null;
                this.legalTargets = [];
            }
        });
    }

    indicesToCoord(row, col) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
        return files[col] + ranks[row];
    }

    getSquareEl(coord) {
        return this.board.querySelector(`.square[data-coord="${coord}"]`);
    }
}

// Bind to window global
window.ChessboardUI = ChessboardUI;
