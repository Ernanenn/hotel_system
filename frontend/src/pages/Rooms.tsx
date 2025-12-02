import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { RoomType } from '../types';
import FiltersBar from '../components/FiltersBar';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';
import SkeletonCard from '../components/SkeletonCard';
import VirtualizedRoomList from '../components/VirtualizedRoomList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

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

interface SearchResponse {
  data: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Rooms = () => {
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [useInfiniteScrollMode, setUseInfiniteScrollMode] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({
    checkIn,
    checkOut,
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    minPrice: 0,
    maxPrice: 1000,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  // Buscar faixa de preços e comodidades disponíveis
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await api.get('/rooms/all');
        const allRooms = Array.isArray(response.data) ? response.data : [];
        
        if (allRooms.length > 0) {
          const prices = allRooms.map((r: Room) => Number(r.pricePerNight));
          const newPriceRange = {
            min: Math.floor(Math.min(...prices) / 10) * 10,
            max: Math.ceil(Math.max(...prices) / 10) * 10,
          };
          setPriceRange(newPriceRange);
          
          // Atualizar filtros com a faixa de preço inicial
          setFilters((prev: any) => ({
            ...prev,
            minPrice: newPriceRange.min,
            maxPrice: newPriceRange.max,
          }));

          const amenitiesSet = new Set<string>();
          allRooms.forEach((room: Room) => {
            if (room.amenities) {
              room.amenities.forEach((amenity) => amenitiesSet.add(amenity));
            }
          });
          setAvailableAmenities(Array.from(amenitiesSet));
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchRooms = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.minOccupancy) params.append('minOccupancy', filters.minOccupancy.toString());
      if (filters.maxOccupancy) params.append('maxOccupancy', filters.maxOccupancy.toString());
      if (filters.amenities && filters.amenities.length > 0) {
        filters.amenities.forEach((a: string) => params.append('amenities', a));
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      params.append('page', page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (checkIn) params.append('checkIn', checkIn);
      if (checkOut) params.append('checkOut', checkOut);

      const response = await api.get<SearchResponse>(`/rooms?${params.toString()}`);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      if (Array.isArray(response.data)) {
        // Fallback para resposta antiga
        setRooms((prevRooms) => append ? [...prevRooms, ...response.data] : response.data);
        setPagination({
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
        });
      } else {
        // Nova resposta com paginação
        const newRooms = response.data.data || [];
        setRooms((prevRooms) => append ? [...prevRooms, ...newRooms] : newRooms);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 12,
          totalPages: response.data.totalPages || 0,
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar quartos:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar quartos';
      setError(errorMessage);
      if (!append) {
        setRooms([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, checkIn, checkOut]);

  useEffect(() => {
    fetchRooms(1, false);
  }, [filters.search, filters.type, filters.minPrice, filters.maxPrice, filters.minOccupancy, filters.maxOccupancy, filters.amenities, filters.sortBy, filters.sortOrder, checkIn, checkOut]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && pagination.page < pagination.totalPages) {
      fetchRooms(pagination.page + 1, true);
    }
  }, [loadingMore, pagination, fetchRooms]);

  const { lastElementRef } = useInfiniteScroll({
    hasMore: pagination.page < pagination.totalPages,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1, checkIn, checkOut });
    setRooms([]); // Reset rooms quando filtros mudam
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const getRoomTypeLabel = (type: string | RoomType) => {
    const labels: Record<string, string> = {
      single: 'Solteiro',
      double: 'Casal',
      suite: 'Suíte',
      deluxe: 'Deluxe',
    };
    return labels[type as string] || type;
  };

  return (
    <Box>
      <Heading mb={6}>Quartos Disponíveis</Heading>
      {checkIn && checkOut && (
        <Text mb={4} color="gray.600">
          Período: {checkIn} até {checkOut}
        </Text>
      )}

      <FiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        priceRange={priceRange}
        availableAmenities={availableAmenities}
      />

      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel htmlFor="infinite-scroll" mb="0" fontSize="sm">
          Modo Infinite Scroll
        </FormLabel>
        <Switch
          id="infinite-scroll"
          isChecked={useInfiniteScrollMode}
          onChange={(e) => {
            setUseInfiniteScrollMode(e.target.checked);
            if (!e.target.checked) {
              // Reset para primeira página quando desativar
              setRooms([]);
              fetchRooms(1, false);
            }
          }}
        />
      </FormControl>

      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
          <SkeletonCard count={6} />
        </SimpleGrid>
      ) : error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <>
          <Box mb={6}>
            <VirtualizedRoomList
              rooms={rooms}
              onRoomClick={(room) => {
                // Navegação já é feita pelo Link no RoomCard
              }}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          </Box>

          {rooms.length === 0 && !loading && (
            <Text textAlign="center" py={8} color="gray.500">
              Nenhum quarto encontrado com os filtros selecionados.
            </Text>
          )}

          {useInfiniteScrollMode ? (
            <>
              {loadingMore && (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2} color="gray.600">Carregando mais quartos...</Text>
                </Box>
              )}
              {pagination.page < pagination.totalPages && (
                <Box ref={lastElementRef} py={4} />
              )}
              {pagination.page >= pagination.totalPages && rooms.length > 0 && (
                <Text textAlign="center" py={4} color="gray.500">
                  Todos os quartos foram carregados.
                </Text>
              )}
            </>
          ) : (
            pagination.totalPages > 1 && (
              <Box mt={6}>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </Box>
            )
          )}
        </>
      )}
    </Box>
  );
};

export default Rooms;

