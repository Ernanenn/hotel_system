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
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import api from '../../services/api';
import { PaymentStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  createdAt: string;
  reservation: {
    id: string;
    room: {
      number: string;
    };
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    const colors = {
      pending: 'yellow',
      completed: 'green',
      failed: 'red',
      refunded: 'orange',
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
      <Heading mb={6}>Gerenciar Pagamentos</Heading>

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
              <Th>Valor</Th>
              <Th>Método</Th>
              <Th>Status</Th>
              <Th>Data</Th>
            </Tr>
          </Thead>
          <Tbody>
            {payments.map((payment) => (
              <Tr key={payment.id}>
                <Td>{payment.id.substring(0, 8)}...</Td>
                <Td>
                  {payment.reservation.user.firstName}{' '}
                  {payment.reservation.user.lastName}
                </Td>
                <Td>{payment.reservation.room.number}</Td>
                <Td>{formatCurrency(payment.amount)}</Td>
                <Td>{payment.method}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </Td>
                <Td>{new Date(payment.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default AdminPayments;

