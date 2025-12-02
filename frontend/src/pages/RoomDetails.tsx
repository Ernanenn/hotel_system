import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Image,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';

interface Room {
  id: string;
  number: string;
  type: string;
  pricePerNight: number;
  description: string;
  amenities: string[] | null;
  imageUrl: string | null;
  maxOccupancy: number;
  ratingAverage?: number;
}

interface Review {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const fetchReviews = async (roomId: string) => {
    try {
      setLoadingReviews(true);
      const response = await api.get(`/reviews/room/${roomId}`);
      setReviewsData(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar avaliações:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const fetchRoom = async () => {
      if (!id) {
        setError('ID do quarto não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/rooms/${id}`);
        
        if (!response.data) {
          throw new Error('Resposta vazia do servidor');
        }
        
        setRoom(response.data);
      } catch (err: any) {
        console.error('Erro ao carregar quarto:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar quarto';
        setError(errorMessage);
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
    if (id) {
      fetchReviews(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReserve = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      setError('ID do quarto não encontrado');
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Por favor, selecione as datas de check-in e check-out');
      return;
    }

    try {
      navigate(`/reservations/new?roomId=${id}&checkIn=${checkIn}&checkOut=${checkOut}`);
    } catch (err) {
      console.error('Erro ao navegar para página de reserva:', err);
      setError('Erro ao redirecionar para página de reserva');
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: 'Solteiro',
      double: 'Casal',
      suite: 'Suíte',
      deluxe: 'Deluxe',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error || 'Quarto não encontrado'}
      </Alert>
    );
  }

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        {room.imageUrl && (
          <Image src={room.imageUrl} alt={room.number} borderRadius="lg" maxH="400px" objectFit="cover" />
        )}
        <HStack justify="space-between">
          <Heading>Quarto {room.number}</Heading>
          <Badge colorScheme="brand" fontSize="lg" px={3} py={1}>
            {getRoomTypeLabel(room.type)}
          </Badge>
        </HStack>

        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="brand.600">
            {formatCurrency(room.pricePerNight)}/noite
          </Text>
          {room.ratingAverage !== undefined && room.ratingAverage > 0 && (
            <VStack align="end" spacing={1}>
              <StarRating rating={room.ratingAverage} size={20} showRating={true} />
              {reviewsData && (
                <Text fontSize="sm" color="gray.600">
                  {reviewsData.totalReviews} avaliação(ões)
                </Text>
              )}
            </VStack>
          )}
        </HStack>

        <Text>{room.description}</Text>

        <Box>
          <Heading size="md" mb={3}>Comodidades</Heading>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
            {room.amenities && room.amenities.length > 0 ? (
              room.amenities.map((amenity, index) => (
                <Text key={index}>• {amenity}</Text>
              ))
            ) : (
              <Text color="gray.500">Nenhuma comodidade listada</Text>
            )}
          </SimpleGrid>
        </Box>

        <Box bg="gray.50" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2}>Informações</Text>
          <Text>Capacidade máxima: {room.maxOccupancy} pessoas</Text>
          {checkIn && checkOut && (
            <>
              <Text>Check-in: {checkIn}</Text>
              <Text>Check-out: {checkOut}</Text>
            </>
          )}
        </Box>

        <Button
          colorScheme="brand"
          size="lg"
          onClick={handleReserve}
          isDisabled={!checkIn || !checkOut}
        >
          {checkIn && checkOut ? 'Reservar Agora' : 'Selecione as datas para reservar'}
        </Button>

        {(!checkIn || !checkOut) && (
          <Link to="/">
            <Button variant="outline" w="100%">
              Voltar e Selecionar Datas
            </Button>
          </Link>
        )}

        <Divider />

        {/* Seção de Avaliações */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Avaliações</Heading>
            {user && (
              <Button size="sm" colorScheme="brand" onClick={onOpen}>
                Deixar Avaliação
              </Button>
            )}
          </HStack>

          {loadingReviews ? (
            <Spinner />
          ) : reviewsData && reviewsData.reviews.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {reviewsData.reviews.map((review) => (
                <ReviewCard key={review.id} {...review} />
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              Ainda não há avaliações para este quarto.
            </Text>
          )}
        </Box>
      </VStack>

      {/* Modal de Avaliação */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <Box p={6}>
            <ReviewForm
              roomId={id || ''}
              onSuccess={async () => {
                onClose();
                if (id) {
                  await fetchReviews(id);
                  // Recarregar dados do quarto para atualizar ratingAverage
                  const response = await api.get(`/rooms/${id}`);
                  setRoom(response.data);
                }
              }}
              onCancel={onClose}
            />
          </Box>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RoomDetails;

