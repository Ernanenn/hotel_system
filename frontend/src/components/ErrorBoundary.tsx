import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, VStack, Alert, AlertIcon } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
          <VStack spacing={4} maxW="600px" textAlign="center">
            <Alert status="error">
              <AlertIcon />
              <Box>
                <Heading size="md" mb={2}>Ops! Algo deu errado</Heading>
                <Text>
                  {this.state.error?.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
                </Text>
              </Box>
            </Alert>
            <Button colorScheme="brand" onClick={this.handleReset}>
              Voltar para a página inicial
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

