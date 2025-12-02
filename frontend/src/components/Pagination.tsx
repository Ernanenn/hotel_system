import {
  HStack,
  Button,
  Text,
  IconButton,
  Select,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" spacing={4}>
      <HStack>
        <Text fontSize="sm" color="gray.600">
          Mostrando {startItem} - {endItem} de {totalItems} quartos
        </Text>
        {onItemsPerPageChange && (
          <HStack>
            <Text fontSize="sm" color="gray.600">
              Itens por página:
            </Text>
            <Select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              size="sm"
              w="80px"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </Select>
          </HStack>
        )}
      </HStack>

      <HStack spacing={2}>
        <IconButton
          aria-label="Página anterior"
          icon={<ChevronLeftIcon />}
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
          size="sm"
        />

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <Text key={`ellipsis-${index}`} px={2}>
                ...
              </Text>
            );
          }

          const pageNum = page as number;
          return (
            <Button
              key={pageNum}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              colorScheme={currentPage === pageNum ? 'brand' : 'gray'}
              variant={currentPage === pageNum ? 'solid' : 'outline'}
            >
              {pageNum}
            </Button>
          );
        })}

        <IconButton
          aria-label="Próxima página"
          icon={<ChevronRightIcon />}
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          size="sm"
        />
      </HStack>
    </HStack>
  );
};

export default Pagination;

