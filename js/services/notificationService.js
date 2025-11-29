/**
 * NotificationService
 * 
 * Service de gestion des notifications en temps réel depuis ActiveMQ.
 * Gère la connexion WebSocket STOMP, l'abonnement aux topics et la distribution
 * des notifications aux listeners.
 * 
 * Features:
 * - Connexion WebSocket avec protocole STOMP
 * - Tentative sur plusieurs ports (61614, 61613)
 * - Fallback en mode démo si ActiveMQ indisponible
 * - Gestion des reconnexions
 * - Distribution des événements aux listeners
 * 
 * @class NotificationService
 */
class NotificationService {
    /**
     * @constructor
     * Initialise le service de notifications
     */
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.ws = null;
        this.reconnectInterval = 5000;
        this.listeners = [];
        this.mockMode = false;
        this.reconnectAttempts = 0;
        
        this.WEBSOCKET_URLS = [
            'ws://localhost:61614',  // WebSocket natif
            'ws://localhost:61613'   // STOMP over WebSocket
        ];
        
        this.STOMP_PROTOCOLS = ['v12.stomp', 'v11.stomp', 'v10.stomp'];
        this.CONNECTION_TIMEOUT = 2000;
    }

    /**
     * Démarre la connexion au serveur ActiveMQ
     * Tente de se connecter aux différents ports disponibles
     * 
     * @public
     */
    connect() {
        if (this.mockMode) {
            console.info('[NotificationService] Already in demo mode');
            return;
        }

        try {
            this.tryConnect(this.WEBSOCKET_URLS, 0);
        } catch (error) {
            console.error('[NotificationService] Connection failed:', error.message);
            this.enableMockMode();
        }
    }

    /**
     * Tente de se connecter à une URL WebSocket spécifique
     * 
     * @private
     * @param {Array<string>} urls - Liste des URLs à essayer
     * @param {number} index - Index de l'URL courante
     */
    tryConnect(urls, index) {
        if (index >= urls.length) {
            console.warn('[NotificationService] All connection attempts failed, switching to demo mode');
            this.enableMockMode();
            return;
        }

        const url = urls[index];
        console.info(`[NotificationService] Attempting connection to ${url}`);

        this.ws = new WebSocket(url, this.STOMP_PROTOCOLS);

        const connectionTimeout = setTimeout(() => {
            if (this.ws.readyState !== WebSocket.OPEN) {
                console.warn(`[NotificationService] Connection timeout on ${url}`);
                this.ws.close();
                this.tryConnect(urls, index + 1);
            }
        }, this.CONNECTION_TIMEOUT);

        this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.info(`[NotificationService] Connected successfully to ${url}`);
            this.reconnectAttempts = 0;
            this.sendStompConnect();
            this.subscribeToTopic();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error(`[NotificationService] WebSocket error on ${url}:`, error);
        };

        this.ws.onclose = () => {
            clearTimeout(connectionTimeout);
            console.info('[NotificationService] Connection closed');
            
            if (this.reconnectAttempts < 1) {
                this.reconnectAttempts++;
                setTimeout(() => this.tryConnect(urls, index + 1), 1000);
            } else if (!this.mockMode) {
                console.warn('[NotificationService] Max reconnection attempts reached');
                this.enableMockMode();
            }
        };
    }

    /**
     * Envoie la frame STOMP CONNECT
     * 
     * @private
     */
    sendStompConnect() {
        this.sendStompFrame('CONNECT', {
            'accept-version': '1.2',
            'heart-beat': '0,0'
        });
    }

    /**
     * S'abonne au topic de notifications
     * 
     * @private
     */
    subscribeToTopic() {
        setTimeout(() => {
            this.sendStompFrame('SUBSCRIBE', {
                'id': 'sub-0',
                'destination': '/topic/notifications.global',
                'ack': 'auto'
            });
            console.info('[NotificationService] Subscribed to topic: notifications.global');
        }, 500);
    }

    /**
     * Envoie une frame STOMP formatée
     * 
     * @private
     * @param {string} command - Commande STOMP (CONNECT, SUBSCRIBE, etc.)
     * @param {Object} headers - Headers de la frame
     * @param {string} body - Corps du message (optionnel)
     */
    sendStompFrame(command, headers, body = '') {
        let frame = command + '\n';
        
        for (let key in headers) {
            frame += key + ':' + headers[key] + '\n';
        }
        
        frame += '\n' + body + '\0';
        
        console.debug(`[NotificationService] Sending STOMP frame: ${command}`);
        this.ws.send(frame);
    }

    /**
     * Active le mode démonstration avec des notifications fictives
     * 
     * @private
     */
    enableMockMode() {
        this.mockMode = true;
        console.warn('[NotificationService] Demo mode enabled');
        this.loadMockNotifications();
    }

    /**
     * Charge des notifications de démonstration
     * 
     * @private
     */
    loadMockNotifications() {
        const mockNotifs = [
            {
                eventType: 'POLLUTION_ALERT',
                severity: 'HIGH',
                timestamp: new Date().toISOString(),
                message: 'Niveau de pollution élevé détecté dans le centre-ville'
            },
            {
                eventType: 'BIKE_AVAILABILITY_HIGH',
                severity: 'LOW',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                message: 'Station Gare Part-Dieu : 15 vélos disponibles'
            },
            {
                eventType: 'WEATHER_WARNING',
                severity: 'MEDIUM',
                timestamp: new Date(Date.now() - 600000).toISOString(),
                message: 'Risque de pluie dans les 2 prochaines heures'
            }
        ];

        mockNotifs.forEach(n => {
            this.addNotification({
                id: Date.now() + Math.random(),
                eventType: n.eventType,
                severity: n.severity,
                timestamp: n.timestamp,
                message: n.message,
                read: false
            });
        });
    }

    /**
     * Traite les messages STOMP reçus depuis ActiveMQ
     * Parse les frames STOMP et extrait les notifications
     * 
     * @private
     * @param {string} data - Frame STOMP brute
     */
    handleMessage(data) {
        try {
            if (data.startsWith('CONNECTED') || data.startsWith('RECEIPT')) {
                console.debug(`[NotificationService] System frame received: ${data.split('\n')[0]}`);
                return;
            }

            if (!data.startsWith('MESSAGE')) {
                console.debug('[NotificationService] Non-MESSAGE frame ignored');
                return;
            }

            const lines = data.split('\n');
            let messageBody = '';
            let eventType = '';
            let severity = 'LOW';
            let timestamp = new Date().toISOString();
            let inBody = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (line === '' || line === '\0') {
                    inBody = true;
                    continue;
                }

                if (inBody) {
                    messageBody += line;
                } else {
                    if (line.includes(':')) {
                        const [key, ...valueParts] = line.split(':');
                        const value = valueParts.join(':').trim();

                        if (key === 'EventType') eventType = value;
                        if (key === 'Severity') severity = value;
                        if (key === 'Timestamp') timestamp = value;
                    }
                }
            }

            messageBody = messageBody.replace(/\0/g, '').trim();

            if (messageBody) {
                const notification = {
                    id: Date.now() + Math.random(),
                    message: messageBody,
                    eventType: eventType || 'UNKNOWN',
                    severity: severity,
                    timestamp: timestamp ? new Date(timestamp) : new Date(),
                    read: false
                };

                console.info('[NotificationService] Notification received:', {
                    type: notification.eventType,
                    severity: notification.severity
                });
                
                this.addNotification(notification);
            }
        } catch (error) {
            console.error('[NotificationService] Message parsing error:', error.message);
        }
    }

    /**
     * Ajoute une notification et notifie les listeners
     * 
     * @private
     * @param {Object} notification - Notification à ajouter
     */
    addNotification(notification) {
        this.notifications.unshift(notification);
        
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }

        console.debug(`[NotificationService] Total notifications: ${this.notifications.length}`);

        this.listeners.forEach(callback => callback(notification));
    }

    /**
     * Ajoute un listener pour les nouvelles notifications
     * 
     * @public
     * @param {Function} callback - Fonction appelée lors d'une nouvelle notification
     */
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        } else {
            console.error('[NotificationService] addListener requires a function callback');
        }
    }

    /**
     * Marque une notification comme lue
     * 
     * @public
     * @param {string} notificationId - ID de la notification
     */
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    /**
     * Marque toutes les notifications comme lues
     * 
     * @public
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }

    /**
     * Récupère toutes les notifications
     * 
     * @public
     * @returns {Array<Object>} Liste des notifications
     */
    getNotifications() {
        return this.notifications;
    }

    /**
     * Compte les notifications non lues
     * 
     * @public
     * @returns {number} Nombre de notifications non lues
     */
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    /**
     * Ferme la connexion WebSocket
     * 
     * @public
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            console.info('[NotificationService] Disconnected');
        }
    }

    /**
     * Obtient l'icône FontAwesome correspondant au type d'événement
     * 
     * @public
     * @param {string} eventType - Type d'événement
     * @returns {string} Classe CSS de l'icône
     */
    getIconForEventType(eventType) {
        const icons = {
            'POLLUTION_ALERT': 'fa-smog',
            'STATION_MAINTENANCE': 'fa-tools',
            'BIKE_AVAILABILITY_LOW': 'fa-exclamation-triangle',
            'BIKE_AVAILABILITY_HIGH': 'fa-bicycle',
            'STATION_FULL': 'fa-parking',
            'WEATHER_WARNING': 'fa-cloud-showers-heavy',
            'TRAFFIC_ALERT': 'fa-traffic-light'
        };
        return icons[eventType] || 'fa-bell';
    }

    /**
     * Obtient la couleur correspondant à la sévérité
     * 
     * @public
     * @param {string} severity - Niveau de sévérité (HIGH, MEDIUM, LOW)
     * @returns {string} Code couleur hexadécimal
     */
    getColorForSeverity(severity) {
        const colors = {
            'HIGH': '#EF4444',
            'MEDIUM': '#F59E0B',
            'LOW': '#10B981'
        };
        return colors[severity] || '#6B7280';
    }
}

export default NotificationService;
