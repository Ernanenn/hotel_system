import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import theme from './theme';
import './i18n/config';
import { pushNotificationService } from './services/push-notification.service';

// Inicializar service worker e push notifications
if ('serviceWorker' in navigator) {
  pushNotificationService.initialize().then(() => {
    pushNotificationService.checkForUpdates();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ChakraProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

