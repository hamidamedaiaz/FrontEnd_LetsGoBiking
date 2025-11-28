/**
 * Service de gestion des notifications depuis ActiveMQ
 * Écoute les événements de pollution, maintenance, disponibilité, météo et trafic
 */

class NotificationService {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.ws = null;
        this.reconnectInterval = 5000;
        this.listeners = [];
        this.mockMode = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Initialise la connexion WebSocket vers ActiveMQ via STOMP
     */
    connect() {
        // Vérifier si déjà en mode démo
        if (this.mockMode) {
            return;
        }

        try {
            // Essayer les ports WebSocket et STOMP d'ActiveMQ
            const wsUrls = [
                'ws://localhost:61614',  // WebSocket natif
                'ws://localhost:61613'   // STOMP over WebSocket
            ];

            this.tryConnect(wsUrls, 0);

        } catch (error) {
            console.warn('⚠️ ActiveMQ non disponible, passage en mode démo');
            this.mockMode = true;
            this.loadMockNotifications();
        }
    }

    /**
     * Tente de se connecter aux différents ports disponibles
     */
    tryConnect(urls, index) {
        if (index >= urls.length) {
            console.warn('⚠️ Aucun port ActiveMQ disponible, passage en mode démo');
            this.mockMode = true;
            this.loadMockNotifications();
            return;
        }

        const url = urls[index];
        console.log(`🔌 Tentative de connexion à ${url}...`);

        // IMPORTANT : Spécifier les sous-protocoles STOMP acceptés
        this.ws = new WebSocket(url, ['v12.stomp', 'v11.stomp', 'v10.stomp']);

        // Timeout de connexion
        const connectionTimeout = setTimeout(() => {
            if (this.ws.readyState !== WebSocket.OPEN) {
                console.warn(`❌ Timeout sur ${url}`);
                this.ws.close();
                this.tryConnect(urls, index + 1);
            }
        }, 2000);

        this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log(`✅ Connecté à ActiveMQ sur ${url}`);
            this.reconnectAttempts = 0;
            
            // Envoyer frame STOMP CONNECT
            this.sendStompFrame('CONNECT', {
                'accept-version': '1.2',
                'heart-beat': '0,0'
            });

            // S'abonner au topic après connexion
            setTimeout(() => {
                this.sendStompFrame('SUBSCRIBE', {
                    'id': 'sub-0',
                    'destination': '/topic/notifications.global',
                    'ack': 'auto'
                });
                console.log('📬 Abonné au topic notifications.global');
            }, 500);
        };

        this.ws.onmessage = (event) => {
            console.log('📨 Message reçu:', event.data);
            this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.warn(`⚠️ Erreur WebSocket sur ${url}:`, error);
        };

        this.ws.onclose = () => {
            clearTimeout(connectionTimeout);
            console.log('🔌 Connexion fermée');
            
            // Tenter le prochain port ou passer en mode démo
            if (this.reconnectAttempts < 1) {
                this.reconnectAttempts++;
                setTimeout(() => this.tryConnect(urls, index + 1), 1000);
            } else if (!this.mockMode) {
                console.warn('⚠️ Passage en mode démo');
                this.mockMode = true;
                this.loadMockNotifications();
            }
        };
    }

    /**
     * Envoie une frame STOMP formatée
     */
    sendStompFrame(command, headers, body = '') {
        let frame = command + '\n';
        
        // Ajouter les headers
        for (let key in headers) {
            frame += key + ':' + headers[key] + '\n';
        }
        
        frame += '\n' + body + '\0';
        
        console.log('📤 Envoi frame STOMP:', command);
        this.ws.send(frame);
    }

    /**
     * Charge des notifications de démonstration
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
     * Traite les messages reçus depuis ActiveMQ
     */
    handleMessage(data) {
        try {
            console.log('🔍 Parsing message:', data);
            
            // Ignorer les frames CONNECTED et RECEIPT
            if (data.startsWith('CONNECTED') || data.startsWith('RECEIPT')) {
                console.log('✅ Frame système reçue:', data.split('\n')[0]);
                return;
            }

            // Parser le message STOMP MESSAGE
            if (!data.startsWith('MESSAGE')) {
                console.warn('⚠️ Frame non-MESSAGE ignorée');
                return;
            }

            const lines = data.split('\n');
            let messageBody = '';
            let eventType = '';
            let severity = 'LOW';
            let timestamp = new Date().toISOString();
            let inBody = false;

            // Extraire les headers et le body
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (line === '' || line === '\0') {
                    inBody = true;
                    continue;
                }

                if (inBody) {
                    messageBody += line;
                } else {
                    // Parser les headers
                    if (line.includes(':')) {
                        const [key, ...valueParts] = line.split(':');
                        const value = valueParts.join(':').trim();

                        if (key === 'EventType') eventType = value;
                        if (key === 'Severity') severity = value;
                        if (key === 'Timestamp') timestamp = value;
                    }
                }
            }

            // Nettoyer le body (enlever \0 à la fin)
            messageBody = messageBody.replace(/\0/g, '').trim();

            console.log('📦 Message parsé:', { messageBody, eventType, severity, timestamp });

            if (messageBody) {
                const notification = {
                    id: Date.now() + Math.random(),
                    message: messageBody,
                    eventType: eventType || 'UNKNOWN',
                    severity: severity,
                    timestamp: timestamp ? new Date(timestamp) : new Date(),
                    read: false
                };

                console.log('✅ Notification créée:', notification);
                this.addNotification(notification);
            }
        } catch (error) {
            console.error('❌ Erreur parsing message:', error);
            console.error('❌ Data brute:', data);
        }
    }

    /**
     * Ajoute une notification et notifie les écouteurs
     */
    addNotification(notification) {
        console.log('➕ Ajout notification:', notification.message);
        
        this.notifications.unshift(notification);
        
        // Limiter le nombre de notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }

        console.log(`📊 Total notifications: ${this.notifications.length}`);

        // Notifier tous les écouteurs
        this.listeners.forEach(callback => {
            console.log('🔔 Notification des listeners');
            callback(notification);
        });
    }

    /**
     * Ajoute un écouteur pour les nouvelles notifications
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Marque une notification comme lue
     */
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    /**
     * Marque toutes les notifications comme lues
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }

    /**
     * Récupère toutes les notifications
     */
    getNotifications() {
        return this.notifications;
    }

    /**
     * Compte les notifications non lues
     */
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    /**
     * Déconnexion
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    /**
     * Obtient l'icône correspondant au type d'événement
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
