import { useState, useEffect } from 'react';
import { Button, useToast, Alert, AlertIcon } from '@chakra-ui/react';
import { pushNotificationService } from '../services/push-notification.service';
import api from '../services/api';

interface PushNotificationButtonProps {
  userId: string;
  onSubscriptionChange?: (subscribed: boolean) => void;
}

const PushNotificationButton = ({
  userId,
  onSubscriptionChange,
}: PushNotificationButtonProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const toast = useToast();

  useEffect(() => {
    checkSupport();
    checkSubscription();
  }, [userId]);

  const checkSupport = () => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
  };

  const checkSubscription = async () => {
    try {
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(!!subscription);
      onSubscriptionChange?.(!!subscription);
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

      // Solicitar permissão
      const permission = await pushNotificationService.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações para receber push notifications.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Inscrever-se em push notifications
      const subscription = await pushNotificationService.subscribeToPush();
      if (!subscription) {
        throw new Error('Falha ao criar subscription');
      }

      // Enviar subscription para o backend
      await api.post('/push/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!)),
            ),
            auth: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)),
            ),
          },
        },
      });

      setIsSubscribed(true);
      onSubscriptionChange?.(true);

      toast({
        title: 'Inscrito com sucesso',
        description: 'Você receberá notificações push.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Erro ao inscrever-se:', error);
      toast({
        title: 'Erro',
        description:
          error.message || 'Erro ao inscrever-se em push notifications.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);

      await pushNotificationService.unsubscribeFromPush();
      await api.delete('/push/unsubscribe');

      setIsSubscribed(false);
      onSubscriptionChange?.(false);

      toast({
        title: 'Inscrição removida',
        description: 'Você não receberá mais notificações push.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Erro ao cancelar inscrição:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cancelar inscrição.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Alert status="warning">
        <AlertIcon />
        Seu navegador não suporta push notifications.
      </Alert>
    );
  }

  return (
    <Button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      isLoading={isLoading}
      colorScheme={isSubscribed ? 'red' : 'brand'}
      size="sm"
    >
      {isSubscribed ? 'Desativar Notificações Push' : 'Ativar Notificações Push'}
    </Button>
  );
};

export default PushNotificationButton;

