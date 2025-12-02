import { HStack, Icon } from '@chakra-ui/react';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { BsStar } from 'react-icons/bs';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  showRating?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  color = 'yellow.400',
  showRating = false,
  interactive = false,
  onRatingChange,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <HStack spacing={1}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon
          key={`full-${i}`}
          as={FaStar}
          boxSize={size}
          color={color}
          cursor={interactive ? 'pointer' : 'default'}
          onClick={() => handleStarClick(i)}
        />
      ))}
      {hasHalfStar && (
        <Icon
          as={FaStarHalfAlt}
          boxSize={size}
          color={color}
          cursor={interactive ? 'pointer' : 'default'}
          onClick={() => handleStarClick(fullStars)}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon
          key={`empty-${i}`}
          as={BsStar}
          boxSize={size}
          color="gray.300"
          cursor={interactive ? 'pointer' : 'default'}
          onClick={() => handleStarClick(fullStars + (hasHalfStar ? 1 : 0) + i)}
        />
      ))}
      {showRating && (
        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
          {rating.toFixed(1)}
        </span>
      )}
    </HStack>
  );
};

export default StarRating;

