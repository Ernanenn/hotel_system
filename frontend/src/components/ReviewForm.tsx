import { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  Alert,
  AlertIcon,
  Heading,
} from '@chakra-ui/react';
import StarRating from './StarRating';
import api from '../services/api';

interface ReviewFormProps {
  roomId: string;
  reservationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  roomId,
  reservationId,
  onSuccess,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Por favor, selecione uma avaliação');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        roomId,
        reservationId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
      <Heading size="md" mb={4}>
        Deixe sua Avaliação
      </Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Avaliação</FormLabel>
            <StarRating
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size={30}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Comentário (opcional)</FormLabel>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Compartilhe sua experiência..."
              rows={4}
            />
          </FormControl>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <HStack>
            <Button
              type="submit"
              colorScheme="brand"
              isLoading={submitting}
              loadingText="Enviando..."
            >
              Enviar Avaliação
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

export default ReviewForm;

