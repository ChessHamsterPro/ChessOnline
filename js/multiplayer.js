/**
 * Obsidian Chess - Peer-to-Peer WebRTC Multiplayer Manager (Classic Global Script)
 * Enhanced with STUN/TURN ICE servers for reliable cross-network NAT traversal.
 */

class P2PMultiplayerManager {
    /**
     * @param {Object} options
     * @param {Function} options.onConnectionEstablished - Callback when guest connects (or host connects to host)
     * @param {Function} options.onDataReceived - Callback when a remote message is received
     * @param {Function} options.onConnectionClosed - Callback when connection drops
     * @param {Function} options.onStatusChange - Callback to display status logs in UI
     */
    constructor(options = {}) {
        this.peer = null;
        this.conn = null;
        this.myPeerId = null;
        this.partnerPeerId = null;
        this._connectTimeout = null;
        
        this.onConnectionEstablished = options.onConnectionEstablished || (() => {});
        this.onDataReceived = options.onDataReceived || (() => {});
        this.onConnectionClosed = options.onConnectionClosed || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.isHost = false;
    }

    /**
     * Initialize PeerJS client with STUN/TURN ICE servers for NAT traversal.
     * This ensures connections work across different networks (e.g., laptop WiFi to mobile data).
     */
    initPeer() {
        return new Promise((resolve, reject) => {
            if (this.peer && !this.peer.destroyed) {
                resolve(this.myPeerId);
                return;
            }

            this.onStatusChange('CONNECTING', 'Connecting to WebRTC gateway...');
            
            // ICE server configuration for reliable NAT traversal across networks
            const iceServers = [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // Open relay TURN servers for symmetric NAT fallback
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ];

            this.peer = new Peer(undefined, {
                debug: 2,
                config: {
                    iceServers: iceServers
                }
            });

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                console.log('[P2P] My Peer ID:', id);
                this.onStatusChange('DISCONNECTED', 'Connected to signaling server. Ready.');
                resolve(id);
            });

            this.peer.on('error', (err) => {
                console.error('[P2P] PeerJS error:', err.type, err);
                
                if (err.type === 'peer-unavailable') {
                    this.onStatusChange('DISCONNECTED', 'Host not found. The room may have expired.');
                } else if (err.type === 'network') {
                    this.onStatusChange('DISCONNECTED', 'Network error. Check your internet connection.');
                } else if (err.type === 'server-error') {
                    this.onStatusChange('DISCONNECTED', 'Signaling server unavailable. Try again later.');
                } else {
                    this.onStatusChange('DISCONNECTED', `Connection error: ${err.type}`);
                }
                reject(err);
            });

            this.peer.on('disconnected', () => {
                console.warn('[P2P] Disconnected from signaling server. Attempting reconnect...');
                // Auto-reconnect to signaling server (not to peer)
                if (this.peer && !this.peer.destroyed) {
                    this.peer.reconnect();
                }
            });

            this.peer.on('connection', (connection) => {
                console.log('[P2P] Incoming connection from:', connection.peer);
                
                if (this.conn) {
                    connection.on('open', () => {
                        connection.send({ type: 'SYSTEM_MESSAGE', text: 'Room is already full.' });
                        setTimeout(() => connection.close(), 500);
                    });
                    return;
                }
                
                this.isHost = true;
                this.conn = connection;
                this.setupConnectionListeners();
            });
        });
    }

    /**
     * Generate room invite link based on host peer ID.
     */
    getInviteLink() {
        if (!this.myPeerId) return '';
        const url = new URL(window.location.href);
        url.searchParams.set('room', this.myPeerId);
        return url.toString();
    }

    /**
     * Connect to host using their room ID.
     * @param {string} hostId - The host peer ID
     */
    connectToHost(hostId) {
        this.isHost = false;
        this.partnerPeerId = hostId;
        
        this.initPeer().then(() => {
            console.log('[P2P] Connecting to host:', hostId);
            this.onStatusChange('CONNECTING', 'Connecting to host...');
            
            this.conn = this.peer.connect(hostId, {
                reliable: true,
                serialization: 'json'
            });
            
            this.setupConnectionListeners();
            
            // Connection timeout — if no 'open' event fires within 15 seconds, notify user
            this._connectTimeout = setTimeout(() => {
                if (!this.conn || !this.conn.open) {
                    console.warn('[P2P] Connection timeout after 15s');
                    this.onStatusChange('DISCONNECTED', 'Connection timed out. Host may be offline.');
                }
            }, 15000);
            
        }).catch(err => {
            console.error('[P2P] Failed to init peer for guest:', err);
            this.onStatusChange('DISCONNECTED', 'Failed to connect to signaling server.');
        });
    }

    /**
     * Set listeners for the active data channel.
     */
    setupConnectionListeners() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            // Clear connection timeout
            if (this._connectTimeout) {
                clearTimeout(this._connectTimeout);
                this._connectTimeout = null;
            }
            
            this.partnerPeerId = this.conn.peer;
            console.log('[P2P] Data channel OPEN with:', this.partnerPeerId);
            this.onStatusChange('CONNECTED', 'Session established! Match starting.');
            this.onConnectionEstablished(this.isHost);
        });

        this.conn.on('data', (data) => {
            console.log('[P2P] Data received:', data.type);
            this.onDataReceived(data);
        });

        this.conn.on('close', () => {
            console.log('[P2P] Connection closed.');
            this.handleDisconnect();
        });

        this.conn.on('error', (err) => {
            console.error('[P2P] Data channel error:', err);
            this.handleDisconnect();
        });
    }

    /**
     * Send packet to opponent browser.
     * @param {Object} data - Packet data (moves, chat, undo requests)
     */
    send(data) {
        if (this.conn && this.conn.open) {
            console.log('[P2P] Sending:', data.type);
            this.conn.send(data);
        } else {
            console.warn('[P2P] Cannot send — data channel is not open.', data.type);
        }
    }

    handleDisconnect() {
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }
        this.conn = null;
        this.partnerPeerId = null;
        this.onStatusChange('DISCONNECTED', 'Opponent disconnected.');
        this.onConnectionClosed();
    }

    /**
     * Hard close all network channels and cleanup memory.
     */
    destroy() {
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }
        if (this.conn) {
            this.conn.close();
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.conn = null;
        this.myPeerId = null;
        this.partnerPeerId = null;
    }
}

// Bind to window global
window.P2PMultiplayerManager = P2PMultiplayerManager;
