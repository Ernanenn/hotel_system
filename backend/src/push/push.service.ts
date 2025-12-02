import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(UserPreferences)
    private userPreferencesRepository: Repository<UserPreferences>,
  ) {
    // Configurar VAPID keys (em produção, usar variáveis de ambiente)
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@hotel.com';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.logger.log('VAPID keys configuradas');
    } else {
      this.logger.warn('VAPID keys não configuradas. Push notifications não funcionarão.');
    }
  }

  async subscribe(userId: string, subscribeDto: SubscribePushDto): Promise<void> {
    const preferences = await this.userPreferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      throw new Error('User preferences not found');
    }

    preferences.pushSubscription = JSON.stringify(subscribeDto.subscription);
    preferences.pushNotifications = true;
    await this.userPreferencesRepository.save(preferences);

    this.logger.log(`Push subscription salva para usuário ${userId}`);
  }

  async unsubscribe(userId: string): Promise<void> {
    const preferences = await this.userPreferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      return;
    }

    preferences.pushSubscription = null;
    preferences.pushNotifications = false;
    await this.userPreferencesRepository.save(preferences);

    this.logger.log(`Push subscription removida para usuário ${userId}`);
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    const preferences = await this.userPreferencesRepository.findOne({
      where: { userId },
    });

    if (
      !preferences ||
      !preferences.pushNotifications ||
      !preferences.pushSubscription
    ) {
      return;
    }

    try {
      const subscription = JSON.parse(preferences.pushSubscription);
      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: data || {},
      });

      await webpush.sendNotification(subscription, payload);
      this.logger.log(`Notificação push enviada para usuário ${userId}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar notificação push para usuário ${userId}:`, error);
      // Se a subscription for inválida, remover
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.unsubscribe(userId);
      }
    }
  }

  async sendNotificationToAll(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    const preferences = await this.userPreferencesRepository.find({
      where: {
        pushNotifications: true,
        pushSubscription: Not(IsNull()),
      },
    });

    for (const pref of preferences) {
      if (pref.pushSubscription) {
        await this.sendNotification(pref.userId, title, body, data);
      }
    }
  }
}

