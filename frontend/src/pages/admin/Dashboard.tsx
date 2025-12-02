import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

interface Stats {
  totalReservations: number;
  pendingReservations: number;
  totalRevenue: number;
  recentReservations: any[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [reservationsRes, paymentsRes] = await Promise.all([
          api.get('/reservations'),
          api.get('/payments'),
        ]);

        const reservations = reservationsRes.data;
        const payments = paymentsRes.data;

        const totalReservations = reservations.length;
        const pendingReservations = reservations.filter(
          (r: any) => r.status === 'pending',
        ).length;
        const totalRevenue = payments
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        setStats({
          totalReservations,
          pendingReservations,
          totalRevenue,
          recentReservations: reservations.slice(0, 5),
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // WebSocket connection for real-time notifications
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const socket = io(wsUrl);

    socket.on('admin_notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Dashboard Admin</Heading>

      {notifications.length > 0 && (
        <Card mb={6} bg="blue.50">
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <Text fontWeight="bold">Novas Notificações:</Text>
              {notifications.map((notif, index) => (
                <Text key={index}>
                  Nova reserva: Quarto {notif.reservation?.roomNumber} -{' '}
                  {notif.reservation?.guestName}
                </Text>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total de Reservas</StatLabel>
              <StatNumber>{stats?.totalReservations || 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Reservas Pendentes</StatLabel>
              <StatNumber>{stats?.pendingReservations || 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Receita Total</StatLabel>
              <StatNumber>{formatCurrency(stats?.totalRevenue || 0)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Reservas Recentes</Heading>
          <VStack align="stretch" spacing={3}>
            {stats?.recentReservations.map((reservation) => (
              <Box key={reservation.id} p={3} bg="gray.50" borderRadius="md">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Quarto {reservation.room.number}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {reservation.checkIn} até {reservation.checkOut}
                    </Text>
                  </VStack>
                  <Badge colorScheme={reservation.status === 'confirmed' ? 'green' : 'yellow'}>
                    {reservation.status}
                  </Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AdminDashboard;

