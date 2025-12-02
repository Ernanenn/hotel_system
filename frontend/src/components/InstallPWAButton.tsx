import { useState, useEffect } from 'react';
import { Button, useToast } from '@chakra-ui/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escutar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escutar evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: 'App instalado',
        description: 'O aplicativo foi instalado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Instalação não disponível',
        description: 'O app já está instalado ou não pode ser instalado neste dispositivo.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Mostrar prompt de instalação
      await deferredPrompt.prompt();

      // Aguardar escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast({
          title: 'Instalação iniciada',
          description: 'O app está sendo instalado...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao instalar app:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao instalar o aplicativo.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isInstalled) {
    return null; // Não mostrar botão se já estiver instalado
  }

  if (!deferredPrompt) {
    return null; // Não mostrar botão se não houver prompt disponível
  }

  return (
    <Button
      onClick={handleInstallClick}
      colorScheme="brand"
      size="sm"
      leftIcon={<span>📱</span>}
    >
      Instalar App
    </Button>
  );
};

export default InstallPWAButton;

