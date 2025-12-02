import { Workbox } from 'workbox-window';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private workbox: Workbox | null = null;

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Registrar service worker do Vite PWA
        this.workbox = new Workbox('/sw.js', { type: 'module' });
        await this.workbox.register();
        this.registration = await navigator.serviceWorker.ready;
        console.log('Service Worker registrado com sucesso');
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Este navegador não suporta notificações');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Permissão de notificação negada');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service Worker não está disponível');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || '',
        ),
      });

      return subscription;
    } catch (error) {
      console.error('Erro ao inscrever-se em push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Erro ao obter subscription:', error);
      return null;
    }
  }

  showLocalNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async checkForUpdates(): Promise<void> {
    if (this.workbox) {
      this.workbox.addEventListener('waiting', () => {
        // Notificar usuário sobre atualização disponível
        if (window.confirm('Nova versão disponível! Deseja atualizar?')) {
          this.workbox?.messageSkipWaiting();
          window.location.reload();
        }
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();

