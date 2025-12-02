import { Box, Skeleton, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

const SkeletonTable = ({ rows = 5, columns = 5 }: SkeletonTableProps) => {
  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            {Array.from({ length: columns }).map((_, index) => (
              <Th key={index}>
                <Skeleton height="20px" width="80px" />
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <Tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Td key={colIndex}>
                  <Skeleton height="20px" width="100%" />
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default SkeletonTable;

