import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
} from '@chakra-ui/react';
import StarRating from './StarRating';

interface ReviewCardProps {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  rating: number;
  comment?: string;
  isVerified?: boolean;
  createdAt: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  user,
  rating,
  comment,
  isVerified = false,
  createdAt,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg="white"
      shadow="sm"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Avatar
              size="sm"
              name={`${user.firstName} ${user.lastName}`}
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">
                {user.firstName} {user.lastName}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {formatDate(createdAt)}
              </Text>
            </VStack>
          </HStack>
          {isVerified && (
            <Badge colorScheme="green">Verificado</Badge>
          )}
        </HStack>

        <StarRating rating={rating} size={16} />

        {comment && (
          <Text color="gray.700" fontSize="sm">
            {comment}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default ReviewCard;

