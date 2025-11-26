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
     * Initialise la connexion WebSocket vers le proxy ActiveMQ
     */
    connect() {
        // Vérifier si déjà en mode démo
        if (this.mockMode) {
            return;
        }

        try {
            // URL du WebSocket proxy vers ActiveMQ (à adapter selon votre configuration)
            this.ws = new WebSocket('ws://localhost:61614');

            // Timeout de 2 secondes pour détecter si ActiveMQ n'est pas disponible
            const connectionTimeout = setTimeout(() => {
                if (this.ws.readyState !== WebSocket.OPEN) {
                    console.warn('⚠️ ActiveMQ non disponible, passage en mode démo');
                    this.ws.close();
                    this.mockMode = true;
                    this.loadMockNotifications();
                }
            }, 2000);

            this.ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ Connected to ActiveMQ notifications');
                this.reconnectAttempts = 0;
                
                // S'abonner au topic notifications.global
                const subscribeFrame = `CONNECT
accept-version:1.2
heart-beat:0,0

\0SUBSCRIBE
id:sub-0
destination:/topic/notifications.global
ack:auto

\0`;
                console.log('📤 Sending STOMP subscription frame...');
                this.ws.send(subscribeFrame);
            };

            this.ws.onmessage = (event) => {
                console.log('📨 Received message from ActiveMQ:', event.data);
                this.handleMessage(event.data);
            };

            this.ws.onerror = () => {
                clearTimeout(connectionTimeout);
                // Silencieux - géré par onclose
            };

            this.ws.onclose = () => {
                clearTimeout(connectionTimeout);
                // Ne pas reconnecter automatiquement en boucle
                if (!this.mockMode && this.reconnectAttempts < 2) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else if (!this.mockMode) {
                    console.warn('⚠️ Passage en mode démo');
                    this.mockMode = true;
                    this.loadMockNotifications();
                }
            };

        } catch (error) {
            console.warn('⚠️ ActiveMQ non disponible, passage en mode démo');
            this.mockMode = true;
            this.loadMockNotifications();
        }
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
            // Parser le message STOMP
            const lines = data.split('\n');
            let messageBody = '';
            let eventType = '';
            let severity = 'LOW';
            let timestamp = new Date().toISOString();

            // Extraire les propriétés du message
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('EventType:')) {
                    eventType = lines[i].split(':')[1].trim();
                }
                if (lines[i].startsWith('Severity:')) {
                    severity = lines[i].split(':')[1].trim();
                }
                if (lines[i].startsWith('Timestamp:')) {
                    timestamp = lines[i].split(':')[1].trim();
                }
                if (lines[i] === '' && i < lines.length - 1) {
                    messageBody = lines[i + 1];
                    break;
                }
            }

            if (messageBody) {
                const notification = {
                    id: Date.now() + Math.random(),
                    message: messageBody,
                    eventType: eventType,
                    severity: severity,
                    timestamp: new Date(timestamp),
                    read: false
                };

                this.addNotification(notification);
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    }

    /**
     * Ajoute une notification et notifie les écouteurs
     */
    addNotification(notification) {
        this.notifications.unshift(notification);
        
        // Limiter le nombre de notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }

        // Notifier tous les écouteurs
        this.listeners.forEach(callback => callback(notification));
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
