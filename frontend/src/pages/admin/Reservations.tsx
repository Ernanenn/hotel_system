import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import api from '../../services/api';
import { ReservationStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: ReservationStatus;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  room: {
    number: string;
  };
}

const AdminReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservations');
      setReservations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    try {
      await api.patch(`/reservations/${id}`, { status: newStatus });
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: ReservationStatus) => {
    const colors = {
      pending: 'yellow',
      confirmed: 'green',
      cancelled: 'red',
      completed: 'blue',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Gerenciar Reservas</Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Cliente</Th>
              <Th>Quarto</Th>
              <Th>Check-in</Th>
              <Th>Check-out</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {reservations.map((reservation) => (
              <Tr key={reservation.id}>
                <Td>{reservation.id.substring(0, 8)}...</Td>
                <Td>
                  {reservation.user.firstName} {reservation.user.lastName}
                  <br />
                  <Text fontSize="sm" color="gray.500">
                    {reservation.user.email}
                  </Text>
                </Td>
                <Td>{reservation.room.number}</Td>
                <Td>{reservation.checkIn}</Td>
                <Td>{reservation.checkOut}</Td>
                <Td>{formatCurrency(reservation.totalPrice)}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(reservation.status)}>
                    {reservation.status}
                  </Badge>
                </Td>
                <Td>
                  <Select
                    size="sm"
                    value={reservation.status}
                    onChange={(e) =>
                      handleStatusChange(reservation.id, e.target.value as ReservationStatus)
                    }
                  >
                    <option value={ReservationStatus.PENDING}>Pendente</option>
                    <option value={ReservationStatus.CONFIRMED}>Confirmada</option>
                    <option value={ReservationStatus.CANCELLED}>Cancelada</option>
                    <option value={ReservationStatus.COMPLETED}>Concluída</option>
                  </Select>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default AdminReservations;

