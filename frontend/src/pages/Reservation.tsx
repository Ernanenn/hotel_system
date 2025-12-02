import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Button,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Text,
} from '@chakra-ui/react';
import api from '../services/api';

const Reservation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const [guestNotes, setGuestNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!roomId || !checkIn || !checkOut) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !checkIn || !checkOut) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/reservations', {
        roomId,
        checkIn,
        checkOut,
        guestNotes: guestNotes || undefined,
        couponCode: couponCode || undefined,
      });

      if (!response.data?.id) {
        throw new Error('Reserva criada mas ID não retornado');
      }

      const reservationId = response.data.id;
      // Redirect to payment page
      navigate(`/reservations/${reservationId}/checkout`);
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar reserva';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!roomId || !checkIn || !checkOut) {
    return null;
  }

  return (
    <Box maxW="600px" mx="auto">
      <Heading mb={6}>Criar Reserva</Heading>

      <Card mb={6}>
        <CardBody>
          <VStack align="stretch" spacing={2}>
            <Text><strong>Check-in:</strong> {checkIn}</Text>
            <Text><strong>Check-out:</strong> {checkOut}</Text>
          </VStack>
        </CardBody>
      </Card>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Código Promocional (opcional)</FormLabel>
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Observações (opcional)</FormLabel>
            <Textarea
              value={guestNotes}
              onChange={(e) => setGuestNotes(e.target.value)}
              placeholder="Alguma observação especial?"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={loading}
            w="100%"
          >
            Confirmar Reserva
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default Reservation;

