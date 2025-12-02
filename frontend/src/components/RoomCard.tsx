import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  Image,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Box,
} from '@chakra-ui/react';
import { formatCurrency } from '../utils/formatters';
import StarRating from './StarRating';
import { RoomType } from '../types';

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

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  checkIn?: string | null;
  checkOut?: string | null;
}

const RoomCard = ({ room, onClick, checkIn, checkOut }: RoomCardProps) => {
  const getRoomTypeLabel = (type: string | RoomType) => {
    const labels: Record<string, string> = {
      single: 'Solteiro',
      double: 'Casal',
      suite: 'Suíte',
      deluxe: 'Deluxe',
    };
    return labels[type as string] || type;
  };

  const queryParams = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : '';

  return (
    <Card overflow="hidden" h="100%">
      {room.imageUrl ? (
        <Image src={room.imageUrl} alt={room.number} h="200px" objectFit="cover" />
      ) : (
        <Box h="200px" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
          <Text color="gray.500">Sem imagem</Text>
        </Box>
      )}
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Heading size="md">Quarto {room.number}</Heading>
            <Badge colorScheme="brand">{getRoomTypeLabel(room.type)}</Badge>
          </HStack>
          <Text color="gray.600" noOfLines={2}>
            {room.description}
          </Text>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              {formatCurrency(room.pricePerNight)}/noite
            </Text>
            {room.ratingAverage !== undefined && room.ratingAverage > 0 && (
              <StarRating rating={room.ratingAverage} size={16} showRating={true} />
            )}
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Até {room.maxOccupancy} pessoas
          </Text>
          <Link to={`/rooms/${room.id}${queryParams}`}>
            <Button colorScheme="brand" w="100%" onClick={onClick}>
              Ver Detalhes
            </Button>
          </Link>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default RoomCard;

