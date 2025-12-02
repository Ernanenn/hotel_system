import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Card,
  CardBody,
  Text,
  Badge,
  HStack,
  Button,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ReservationStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: ReservationStatus;
  guestNotes: string;
  room: {
    number: string;
    type: string;
  };
  payment?: {
    status: string;
  };
}

const MyReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/reservations');
        if (Array.isArray(response.data)) {
          setReservations(response.data);
        } else {
          setError('Formato de dados inválido');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar reservas');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const getStatusColor = (status: ReservationStatus) => {
    const colors = {
      pending: 'yellow',
      confirmed: 'green',
      cancelled: 'red',
      completed: 'blue',
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: ReservationStatus) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    };
    return labels[status] || status;
  };

  const handlePayment = (reservationId: string) => {
    navigate(`/reservations/${reservationId}/checkout`);
  };

  const handleCheckIn = (reservationId: string) => {
    navigate(`/reservations/${reservationId}/checkin`);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Minhas Reservas</Heading>

      {reservations.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={8}>
          Você ainda não tem reservas.
        </Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {reservations.map((reservation) => {
            if (!reservation || !reservation.id) {
              return null; // Skip invalid reservations
            }
            
            return (
              <Card key={reservation.id}>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Heading size="md">
                        Quarto {reservation.room?.number || 'N/A'}
                      </Heading>
                      <Badge colorScheme={getStatusColor(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                    </HStack>

                    <Text><strong>Check-in:</strong> {reservation.checkIn || 'N/A'}</Text>
                    <Text><strong>Check-out:</strong> {reservation.checkOut || 'N/A'}</Text>
                    <Text><strong>Total:</strong> {formatCurrency(reservation.totalPrice || 0)}</Text>

                    {reservation.payment && (
                      <Text>
                        <strong>Pagamento:</strong>{' '}
                        <Badge colorScheme={reservation.payment.status === 'completed' ? 'green' : 'yellow'}>
                          {reservation.payment.status === 'completed' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </Text>
                    )}

                    <HStack spacing={2}>
                      {reservation.status === ReservationStatus.PENDING && !reservation.payment && (
                        <Button
                          colorScheme="brand"
                          onClick={() => handlePayment(reservation.id)}
                        >
                          Realizar Pagamento
                        </Button>
                      )}
                      {reservation.status === ReservationStatus.CONFIRMED && (
                        <Button
                          colorScheme="green"
                          variant="outline"
                          onClick={() => handleCheckIn(reservation.id)}
                        >
                          Check-in Digital
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

export default MyReservations;

