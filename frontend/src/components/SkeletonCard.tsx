import { Box, Skeleton, SkeletonText, VStack, HStack } from '@chakra-ui/react';

interface SkeletonCardProps {
  count?: number;
}

const SkeletonCard = ({ count = 1 }: SkeletonCardProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
          <Skeleton height="200px" mb={4} />
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Skeleton height="20px" width="60%" />
              <Skeleton height="20px" width="30%" />
            </HStack>
            <SkeletonText noOfLines={2} spacing="2" />
            <HStack justify="space-between">
              <Skeleton height="24px" width="40%" />
              <Skeleton height="20px" width="30%" />
            </HStack>
            <Skeleton height="40px" width="100%" />
          </VStack>
        </Box>
      ))}
    </>
  );
};

export default SkeletonCard;

