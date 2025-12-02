import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  Text,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface ReservationData {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  room: {
    number: string;
    type: string;
  };
  checkedInAt?: string;
  checkedOutAt?: string;
  qrCodeToken?: string;
}

const CheckIn = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/my-reservations');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Buscar dados da reserva
        const reservationRes = await api.get(`/reservations/${id}`);
        setReservation(reservationRes.data);

        // Gerar QR code se a reserva estiver confirmada
        if (reservationRes.data.status === 'confirmed') {
          try {
            const qrRes = await api.get(`/checkin/reservations/${id}/qrcode`);
            if (qrRes.data?.qrCodeDataUrl) {
              setQrCodeData(qrRes.data.qrCodeDataUrl);
            } else {
              console.warn('QR code data URL não retornado');
            }
          } catch (qrError: any) {
            console.error('Erro ao gerar QR code:', qrError);
            const errorMessage =
              qrError.response?.data?.message ||
              'Erro ao gerar QR code. Tente novamente mais tarde.';
            setError(errorMessage);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !reservation) {
    return (
      <Box maxW="600px" mx="auto" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error || 'Reserva não encontrada'}
        </Alert>
        <Button mt={4} onClick={() => navigate('/my-reservations')}>
          Voltar para Minhas Reservas
        </Button>
      </Box>
    );
  }

  const getStatusBadge = () => {
    switch (reservation.status) {
      case 'pending':
        return <Badge colorScheme="yellow">Pendente</Badge>;
      case 'confirmed':
        return <Badge colorScheme="green">Confirmada</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red">Cancelada</Badge>;
      case 'completed':
        return <Badge colorScheme="blue">Concluída</Badge>;
      default:
        return <Badge>{reservation.status}</Badge>;
    }
  };

  return (
    <Box maxW="800px" mx="auto" py={8}>
      <Heading mb={6}>Check-in Digital</Heading>

      <Card mb={6}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Reserva #{reservation.id.substring(0, 8)}
              </Text>
              {getStatusBadge()}
            </HStack>

            <Divider />

            <HStack justify="space-between">
              <Text><strong>Quarto:</strong></Text>
              <Text>{reservation.room?.number || 'N/A'} ({reservation.room?.type || 'N/A'})</Text>
            </HStack>

            <HStack justify="space-between">
              <Text><strong>Check-in:</strong></Text>
              <Text>{new Date(reservation.checkIn).toLocaleDateString('pt-BR')}</Text>
            </HStack>

            <HStack justify="space-between">
              <Text><strong>Check-out:</strong></Text>
              <Text>{new Date(reservation.checkOut).toLocaleDateString('pt-BR')}</Text>
            </HStack>

            <HStack justify="space-between">
              <Text><strong>Total:</strong></Text>
              <Text fontWeight="bold" color="brand.600">
                {formatCurrency(reservation.totalPrice)}
              </Text>
            </HStack>

            {reservation.checkedInAt && (
              <Alert status="success">
                <AlertIcon />
                Check-in realizado em:{' '}
                {new Date(reservation.checkedInAt).toLocaleString('pt-BR')}
              </Alert>
            )}

            {reservation.checkedOutAt && (
              <Alert status="info">
                <AlertIcon />
                Check-out realizado em:{' '}
                {new Date(reservation.checkedOutAt).toLocaleString('pt-BR')}
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>

      {reservation.status === 'confirmed' && !reservation.checkedInAt && (
        <Card>
          <CardBody>
            <VStack spacing={6}>
              <Heading size="md" textAlign="center">
                QR Code para Check-in
              </Heading>

              <Text textAlign="center" color="gray.600">
                Apresente este QR code na recepção do hotel para realizar o check-in
              </Text>

              {qrCodeData ? (
                <Box
                  p={4}
                  bg="white"
                  borderRadius="md"
                  border="2px solid"
                  borderColor="gray.200"
                  display="inline-block"
                >
                  <img src={qrCodeData} alt="QR Code" style={{ width: '300px', height: '300px' }} />
                </Box>
              ) : reservation.qrCodeToken ? (
                <Box
                  p={4}
                  bg="white"
                  borderRadius="md"
                  border="2px solid"
                  borderColor="gray.200"
                  display="inline-block"
                >
                  <QRCodeSVG
                    value={JSON.stringify({
                      reservationId: reservation.id,
                      token: reservation.qrCodeToken,
                      checkIn: reservation.checkIn,
                      checkOut: reservation.checkOut,
                    })}
                    size={300}
                    level="M"
                  />
                </Box>
              ) : (
                <VStack spacing={4}>
                  <Alert status="warning">
                    <AlertIcon />
                    QR code não disponível. Tentando gerar...
                  </Alert>
                  <Button
                    colorScheme="brand"
                    onClick={async () => {
                      try {
                        const qrRes = await api.get(`/checkin/reservations/${id}/qrcode`);
                        if (qrRes.data?.qrCodeDataUrl) {
                          setQrCodeData(qrRes.data.qrCodeDataUrl);
                          setError('');
                        }
                      } catch (err: any) {
                        setError(
                          err.response?.data?.message ||
                            'Erro ao gerar QR code. Entre em contato com a recepção.',
                        );
                      }
                    }}
                  >
                    Gerar QR Code
                  </Button>
                </VStack>
              )}

              <Text fontSize="sm" color="gray.500" textAlign="center">
                Este QR code é único para sua reserva e será usado para validação no check-in
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}

      {reservation.status !== 'confirmed' && (
        <Alert status="info">
          <AlertIcon />
          O QR code só está disponível para reservas confirmadas.
        </Alert>
      )}

      <Button mt={6} onClick={() => navigate('/my-reservations')} w="100%">
        Voltar para Minhas Reservas
      </Button>
    </Box>
  );
};

export default CheckIn;

