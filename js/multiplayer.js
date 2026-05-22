/**
 * Obsidian Chess - Peer-to-Peer WebRTC Multiplayer Manager (Classic Global Script)
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
        
        this.onConnectionEstablished = options.onConnectionEstablished || (() => {});
        this.onDataReceived = options.onDataReceived || (() => {});
        this.onConnectionClosed = options.onConnectionClosed || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.isHost = false;
    }

    /**
     * Initialize PeerJS client.
     */
    initPeer() {
        return new Promise((resolve, reject) => {
            if (this.peer) {
                resolve(this.myPeerId);
                return;
            }

            this.onStatusChange('CONNECTING', 'Connecting to WebRTC gateway...');
            
            // Standard PeerJS cloud server (free, secure)
            this.peer = new Peer(undefined, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                this.onStatusChange('DISCONNECTED', 'Connected to WebRTC. Ready to play.');
                resolve(id);
            });

            this.peer.on('error', (err) => {
                console.error("PeerJS signaling error: ", err);
                this.onStatusChange('DISCONNECTED', `Connection error: ${err.type}`);
                reject(err);
            });

            this.peer.on('connection', (connection) => {
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
            this.onStatusChange('CONNECTING', 'Connecting to host...');
            this.conn = this.peer.connect(hostId, {
                reliable: true
            });
            this.setupConnectionListeners();
        }).catch(err => {
            this.onStatusChange('DISCONNECTED', 'Signaling server handshake failed.');
        });
    }

    /**
     * Set listeners for the active data channel.
     */
    setupConnectionListeners() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            this.partnerPeerId = this.conn.peer;
            this.onStatusChange('CONNECTED', 'Session established! Match starting.');
            this.onConnectionEstablished(this.isHost);
        });

        this.conn.on('data', (data) => {
            this.onDataReceived(data);
        });

        this.conn.on('close', () => {
            this.handleDisconnect();
        });

        this.conn.on('error', (err) => {
            console.error("Data channel error: ", err);
            this.handleDisconnect();
        });
    }

    /**
     * Send packet to opponent browser.
     * @param {Object} data - Packet data (moves, chat, undo requests)
     */
    send(data) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        } else {
            console.warn("Attempted to send data but WebRTC channel is closed.");
        }
    }

    handleDisconnect() {
        this.conn = null;
        this.partnerPeerId = null;
        this.onStatusChange('DISCONNECTED', 'Opponent disconnected.');
        this.onConnectionClosed();
    }

    /**
     * Hard close all network channels and cleanup memory.
     */
    destroy() {
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
