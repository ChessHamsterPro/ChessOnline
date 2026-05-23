/**
 * Obsidian Chess - Interactive 2D Chessboard Controller (Classic Global Script)
 */

// Premium minimalist Chess Piece SVGs inlined for 100% vector scalability and offline speed.
const PIECE_SVGS = {
    wP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M 22.5 9 c -2.21 0 -4 1.79 -4 4 0 .89 .29 1.71 .78 2.38 C 17.33 16.5 16 18.59 16 21 c 0 2.03 .94 3.84 2.41 5.03 C 17.58 26.68 17 27.66 17 28.78 17 30.97 19.21 32.78 22.5 32.78 s 5.5 -1.81 5.5 -4 c 0 -1.12 -.58 -2.1 -1.41 -2.75 C 28.06 24.84 29 23.03 29 21 c 0 -2.41 -1.33 -4.5 -3.28 -5.62 .49 -.67 .78 -1.49 .78 -2.38 0 -2.21 -1.79 -4 -4 -4 z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    wN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22 10 c 10.5 1 16.5 8 16 29 H 15 c 0 -9 10 -6.5 8 -21" fill="#fff"/><path d="M 24 18 c .38 2.91 -5.55 7.37 -8 9 -3 2 -2.82 4.34 -5 4 -1.042 -.94 1.41 -3.04 0 -3 -1 0 .19 1.23 -1 2 -1 0 -4.003 1 -4 -4 0 -2 6 -12 6 -12 s 1.89 -1.9 2 -3.5 c -.73 -.994 -.5 -2 -.5 -3 1 -1 3 2.5 3 2.5 h 2 s .78 -1.992 2.5 -3 c 1 0 1 3 1 3" fill="#fff"/><path d="M 9.5 25.5 a .5 .5 0 1 1 -1 0 .5 .5 0 1 1 1 0 z" fill="#000"/><path d="M 14.933 15.75 a .5 1.5 30 1 1 -.866 -.5 .5 1.5 30 1 1 .866 .5 z" fill="#000" stroke="none"/></g></svg>`,
    wB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M 9 36 c 3.39 -.97 10.11 .43 13.5 -2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65 .54 3 2 -.68 .97 -1.65 .99 -3 .5 -3.39 -.97 -10.11 .46 -13.5 -1 -3.39 1.46 -10.11 .03 -13.5 1 -1.354 .49 -2.323 .47 -3 -.5 1.354 -1.94 3 -2 3 -2 z"/><path d="M 15 32 c 2.5 2.5 12.5 2.5 15 0 .5 -1.5 0 -2 0 -2 0 -2.5 -2.5 -4 -2.5 -4 5.5 -1.5 6 -11.5 -5 -15.5 -11 4 -10.5 14 -5 15.5 0 0 -2.5 1.5 -2.5 4 0 0 -.5 .5 0 2 z"/><path d="M 25 8 a 2.5 2.5 0 1 1 -5 0 2.5 2.5 0 1 1 5 0 z"/></g><path d="M 17.5 26 h 10 M 15 30 h 15" stroke-linejoin="miter"/><path d="M 22.5 15.5 v 7 M 20 18 h 5" fill="none" stroke-linejoin="miter"/></g></svg>`,
    wR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9 39 h 27 v -3 H 9 v 3 z"/><path d="M 12 36 v -4 h 21 v 4 H 12 z"/><path d="M 11 14 V 9 h 4 v 2 h 5 V 9 h 5 v 2 h 5 V 9 h 4 v 5" stroke-linecap="butt"/><path d="M 34 14 l -3 3 H 14 l -3 -3"/><path d="M 15 17 v 12.5 H 30 V 17"/><path d="M 14 29.5 v 4 h 17 v -4" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M 14 17 h 17" fill="none" stroke-linejoin="miter"/></g></svg>`,
    wQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/><path d="M 9 26 c 8.5 -1.5 21 -1.5 27 0 l 2.5 -12.5 L 31 25 l -.3 -14.1 -5.2 13.6 -3 -14.5 -3 14.5 L 14.3 10.9 14 25 6.5 13.5 9 26 z" stroke-linecap="butt"/><path d="M 9 26 c 0 2 1.5 2 3.5 4 1.5 1.5 3 2.5 3 2.5 1.5 -1.5 2.5 -2.5 3 -3 l 3.5 -1 h 3 l 3.5 1 c .5 .5 1.5 1.5 3 3 0 0 1.5 -1 3 -2.5 2 -2 3.5 -2 3.5 -4" stroke-linecap="butt"/><path d="M 11.5 30 c 3.5 -1 18.5 -1 22 0" fill="none"/><path d="M 12 33.5 c 6 -1 15 -1 21 0" fill="none"/></g></svg>`,
    wK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5 11.63 V 6" stroke-linejoin="miter"/><path d="M 20 8 h 5" stroke-linejoin="miter"/><path d="M 22.5 25 s 4.5 -7.5 3 -10.5 c 0 0 -1 -2.5 -3 -2.5 s -3 2.5 -3 2.5 c -1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M 11.5 37 c 5.5 3.5 15.5 3.5 21 0 v -7 s 9 -4.5 6 -10.5 c -4 -6.5 -13.5 -3.5 -16 4.5 V 27 v -3.5 c -3.5 -8 -13 -11 -16 -4.5 -3 6 6 10.5 6 10.5 v 7" fill="#fff"/><path d="M 11.5 30 c 5.5 -3 15.5 -3 21 0 m -21 3.5 c 5.5 -3 15.5 -3 21 0 m -21 3.5 c 5.5 -3 15.5 -3 21 0"/></g></svg>`,
    bP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M 22.5 9 c -2.21 0 -4 1.79 -4 4 0 .89 .29 1.71 .78 2.38 C 17.33 16.5 16 18.59 16 21 c 0 2.03 .94 3.84 2.41 5.03 C 17.58 26.68 17 27.66 17 28.78 17 30.97 19.21 32.78 22.5 32.78 s 5.5 -1.81 5.5 -4 c 0 -1.12 -.58 -2.1 -1.41 -2.75 C 28.06 24.84 29 23.03 29 21 c 0 -2.41 -1.33 -4.5 -3.28 -5.62 .49 -.67 .78 -1.49 .78 -2.38 0 -2.21 -1.79 -4 -4 -4 z" fill="#333" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    bN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22 10 c 10.5 1 16.5 8 16 29 H 15 c 0 -9 10 -6.5 8 -21" fill="#333"/><path d="M 24 18 c .38 2.91 -5.55 7.37 -8 9 -3 2 -2.82 4.34 -5 4 -1.042 -.94 1.41 -3.04 0 -3 -1 0 .19 1.23 -1 2 -1 0 -4.003 1 -4 -4 0 -2 6 -12 6 -12 s 1.89 -1.9 2 -3.5 c -.73 -.994 -.5 -2 -.5 -3 1 -1 3 2.5 3 2.5 h 2 s .78 -1.992 2.5 -3 c 1 0 1 3 1 3" fill="#333"/><path d="M 9.5 25.5 a .5 .5 0 1 1 -1 0 .5 .5 0 1 1 1 0 z" fill="#fff" stroke="#fff"/><path d="M 14.933 15.75 a .5 1.5 30 1 1 -.866 -.5 .5 1.5 30 1 1 .866 .5 z" fill="#fff" stroke="#fff"/></g></svg>`,
    bB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#333" stroke-linecap="butt"><path d="M 9 36 c 3.39 -.97 10.11 .43 13.5 -2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65 .54 3 2 -.68 .97 -1.65 .99 -3 .5 -3.39 -.97 -10.11 .46 -13.5 -1 -3.39 1.46 -10.11 .03 -13.5 1 -1.354 .49 -2.323 .47 -3 -.5 1.354 -1.94 3 -2 3 -2 z"/><path d="M 15 32 c 2.5 2.5 12.5 2.5 15 0 .5 -1.5 0 -2 0 -2 0 -2.5 -2.5 -4 -2.5 -4 5.5 -1.5 6 -11.5 -5 -15.5 -11 4 -10.5 14 -5 15.5 0 0 -2.5 1.5 -2.5 4 0 0 -.5 .5 0 2 z"/><path d="M 25 8 a 2.5 2.5 0 1 1 -5 0 2.5 2.5 0 1 1 5 0 z"/></g><path d="M 17.5 26 h 10 M 15 30 h 15" stroke="#fff" stroke-linejoin="miter"/><path d="M 22.5 15.5 v 7 M 20 18 h 5" fill="none" stroke="#fff" stroke-linejoin="miter"/></g></svg>`,
    bR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#333" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9 39 h 27 v -3 H 9 v 3 z"/><path d="M 12.5 32 l 1.5 -2.5 h 17 l 1.5 2.5" stroke-linecap="butt"/><path d="M 12 36 v -4 h 21 v 4 H 12 z"/><path d="M 14 29.5 v -13 h 17 v 13" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M 14 16.5 L 11 14 h 23 l -3 2.5" stroke-linecap="butt"/><path d="M 11 14 V 9 h 4 v 2 h 5 V 9 h 5 v 2 h 5 V 9 h 4 v 5" stroke-linecap="butt"/><path d="M 12 35.5 h 21" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/><path d="M 13 31.5 h 19" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/><path d="M 14 29.5 h 17" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/><path d="M 14 16.5 h 17" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/></g></svg>`,
    bQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#333" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/><path d="M 9 26 c 8.5 -1.5 21 -1.5 27 0 l 2.5 -12.5 L 31 25 l -.3 -14.1 -5.2 13.6 -3 -14.5 -3 14.5 L 14.3 10.9 14 25 6.5 13.5 9 26 z" stroke-linecap="butt"/><path d="M 9 26 c 0 2 1.5 2 3.5 4 1.5 1.5 3 2.5 3 2.5 1.5 -1.5 2.5 -2.5 3 -3 l 3.5 -1 h 3 l 3.5 1 c .5 .5 1.5 1.5 3 3 0 0 1.5 -1 3 -2.5 2 -2 3.5 -2 3.5 -4" stroke-linecap="butt"/><path d="M 11.5 30 c 3.5 -1 18.5 -1 22 0" fill="none" stroke="#fff"/><path d="M 12 33.5 c 6 -1 15 -1 21 0" fill="none" stroke="#fff"/></g></svg>`,
    bK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5 11.63 V 6" stroke-linejoin="miter"/><path d="M 20 8 h 5" stroke-linejoin="miter"/><path d="M 22.5 25 s 4.5 -7.5 3 -10.5 c 0 0 -1 -2.5 -3 -2.5 s -3 2.5 -3 2.5 c -1.5 3 3 10.5 3 10.5" fill="#333" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M 11.5 37 c 5.5 3.5 15.5 3.5 21 0 v -7 s 9 -4.5 6 -10.5 c -4 -6.5 -13.5 -3.5 -16 4.5 V 27 v -3.5 c -3.5 -8 -13 -11 -16 -4.5 -3 6 6 10.5 6 10.5 v 7" fill="#333"/><path d="M 32.5 30 c -5.5 -3 -15.5 -3 -21 0" fill="none" stroke="#fff"/><path d="M 32.5 33.5 c -5.5 -3 -15.5 -3 -21 0" fill="none" stroke="#fff"/><path d="M 32.5 37 c -5.5 -3 -15.5 -3 -21 0" fill="none" stroke="#fff"/></g></svg>`
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
window.PIECE_SVGS = PIECE_SVGS;
