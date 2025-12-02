import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  Text,
  HStack,
  Divider,
} from '@chakra-ui/react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

const Payment = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [reservationData, setReservationData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get('sessionId'));

  useEffect(() => {
    const loadReservation = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.get(`/reservations/${id}`);
        setReservationData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar reserva');
      } finally {
        setLoading(false);
      }
    };

    const urlSessionId = searchParams.get('sessionId');
    
    if (urlSessionId) {
      if (urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
      }
      if (!reservationData) {
        loadReservation();
      }
    } else if (!sessionId && id) {
      createCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, searchParams]);

  const createCheckout = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.post(`/payments/reservations/${id}/checkout`);
      // URL mock retorna para a mesma página com sessionId
      const urlString = response.data.url;
      if (urlString.includes('sessionId=')) {
        const url = new URL(urlString);
        const newSessionId = url.searchParams.get('sessionId');
        if (newSessionId) {
          setSessionId(newSessionId);
          navigate(`/reservations/${id}/checkout?sessionId=${newSessionId}`, { replace: true });
          const resResponse = await api.get(`/reservations/${id}`);
          setReservationData(resResponse.data);
        } else {
          setError('Erro ao criar sessão de pagamento: sessionId não encontrado na URL');
        }
      } else {
        // Fallback: se não tiver sessionId na URL, tenta criar novamente
        setError('Erro ao criar sessão de pagamento: URL inválida');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    if (!id || !sessionId) {
      setError('Session ID não encontrado');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      
      // Simula processamento de pagamento
      await api.post(`/payments/reservations/${id}/mock-payment`, { sessionId });
      
      // Redireciona para página de sucesso
      navigate(`/reservations/${id}/success`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box maxW="600px" mx="auto" textAlign="center" py={12}>
        <Spinner size="xl" />
        <Text mt={4}>Carregando...</Text>
      </Box>
    );
  }

  if (error && !reservationData) {
    return (
      <Box maxW="600px" mx="auto" py={12}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
        <Button mt={4} onClick={() => navigate('/my-reservations')}>
          Voltar para Minhas Reservas
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="600px" mx="auto" py={8}>
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="lg" textAlign="center">
              Pagamento Simulado
            </Heading>

            <Alert status="info">
              <AlertIcon />
              Este é um ambiente de desenvolvimento. O pagamento será simulado.
            </Alert>

            {reservationData && (
              <>
                <Box>
                  <Heading size="md" mb={3}>Detalhes da Reserva</Heading>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Text><strong>Quarto:</strong></Text>
                      <Text>{reservationData.room?.number || 'N/A'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text><strong>Check-in:</strong></Text>
                      <Text>{reservationData.checkIn}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text><strong>Check-out:</strong></Text>
                      <Text>{reservationData.checkOut}</Text>
                    </HStack>
                    <Divider />
                    {reservationData.discountAmount > 0 && (
                      <>
                        <HStack justify="space-between">
                          <Text>Subtotal:</Text>
                          <Text>
                            {formatCurrency(
                              Number(reservationData.totalPrice) +
                                Number(reservationData.discountAmount || 0),
                            )}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" color="green.600">
                          <Text>
                            <strong>Desconto ({reservationData.couponCode}):</strong>
                          </Text>
                          <Text fontWeight="bold">
                            -{formatCurrency(reservationData.discountAmount || 0)}
                          </Text>
                        </HStack>
                        <Divider />
                      </>
                    )}
                    <HStack justify="space-between" fontSize="xl" fontWeight="bold">
                      <Text>Total:</Text>
                      <Text color="brand.600">{formatCurrency(reservationData.totalPrice)}</Text>
                    </HStack>
                  </VStack>
                </Box>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Heading size="sm" mb={2}>Informações do Pagamento</Heading>
                  <VStack align="stretch" spacing={2} fontSize="sm">
                    <Text><strong>Método:</strong> Pagamento Simulado</Text>
                    <Text><strong>Status:</strong> Aguardando confirmação</Text>
                    <Text color="gray.600">
                      Clique no botão abaixo para simular o pagamento. 
                      Em produção, você seria redirecionado para um gateway de pagamento real.
                    </Text>
                  </VStack>
                </Box>
              </>
            )}

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <Button
              colorScheme="brand"
              size="lg"
              onClick={handleMockPayment}
              isLoading={processing}
              loadingText="Processando..."
            >
              {processing ? 'Processando Pagamento...' : 'Confirmar Pagamento (Simulado)'}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/my-reservations')}
            >
              Cancelar
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Payment;

