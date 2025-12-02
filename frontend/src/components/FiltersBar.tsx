import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Checkbox,
  CheckboxGroup,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Select,
  Input,
  Text,
  Collapse,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FiltersBarProps {
  filters: {
    search?: string;
    type?: RoomType;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    minOccupancy?: number;
    maxOccupancy?: number;
    sortBy?: string;
    sortOrder?: string;
  };
  onFiltersChange: (filters: any) => void;
  priceRange: { min: number; max: number };
  availableAmenities: string[];
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFiltersChange,
  priceRange,
  availableAmenities,
}) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const [localFilters, setLocalFilters] = useState({
    ...filters,
    minPrice: filters.minPrice ?? priceRange.min,
    maxPrice: filters.maxPrice ?? priceRange.max,
  });

  // Sincronizar filtros quando props mudarem
  useEffect(() => {
    setLocalFilters({
      ...filters,
      minPrice: filters.minPrice ?? priceRange.min,
      maxPrice: filters.maxPrice ?? priceRange.max,
    });
  }, [filters, priceRange]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (values: number[]) => {
    const newFilters = {
      ...localFilters,
      minPrice: values[0],
      maxPrice: values[1],
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAmenityToggle = (amenity: string, isChecked: boolean) => {
    const currentAmenities = localFilters.amenities || [];
    const newAmenities = isChecked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter((a) => a !== amenity);
    handleFilterChange('amenities', newAmenities);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      type: undefined,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      amenities: [],
      minOccupancy: undefined,
      maxOccupancy: undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Box bg="white" p={4} borderRadius="md" shadow="sm" mb={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Filtros</Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Limpar Filtros
          </Button>
          <IconButton
            aria-label={isOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
            size="sm"
            variant="ghost"
          />
        </HStack>
      </HStack>

      <Collapse in={isOpen} animateOpacity>
        <VStack spacing={4} align="stretch">
          {/* Busca por texto */}
          <Box>
            <Text mb={2} fontWeight="medium">
              Buscar
            </Text>
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Box>

          {/* Tipo de quarto */}
          <Box>
            <Text mb={2} fontWeight="medium">
              Tipo de Quarto
            </Text>
            <Select
              value={localFilters.type || ''}
              onChange={(e) =>
                handleFilterChange('type', e.target.value || undefined)
              }
              placeholder="Todos os tipos"
            >
              <option value={RoomType.SINGLE}>Solteiro</option>
              <option value={RoomType.DOUBLE}>Casal</option>
              <option value={RoomType.SUITE}>Suíte</option>
              <option value={RoomType.DELUXE}>Deluxe</option>
            </Select>
          </Box>

          {/* Faixa de preço */}
          <Box>
            <Text mb={2} fontWeight="medium">
              Preço por Noite
            </Text>
            <VStack spacing={2}>
              <RangeSlider
                aria-label={['min', 'max']}
                value={[
                  localFilters.minPrice || priceRange.min,
                  localFilters.maxPrice || priceRange.max,
                ]}
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                onChange={handlePriceRangeChange}
              >
                <RangeSliderTrack>
                  <RangeSliderFilledTrack />
                </RangeSliderTrack>
                <RangeSliderThumb index={0} />
                <RangeSliderThumb index={1} />
              </RangeSlider>
              <HStack justify="space-between" w="100%">
                <Text fontSize="sm">
                  {formatCurrency(localFilters.minPrice || priceRange.min)}
                </Text>
                <Text fontSize="sm">
                  {formatCurrency(localFilters.maxPrice || priceRange.max)}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* Capacidade */}
          <Box>
            <Text mb={2} fontWeight="medium">
              Capacidade
            </Text>
            <HStack>
              <Input
                type="number"
                placeholder="Mín."
                value={localFilters.minOccupancy || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'minOccupancy',
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
              />
              <Text>até</Text>
              <Input
                type="number"
                placeholder="Máx."
                value={localFilters.maxOccupancy || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'maxOccupancy',
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
              />
            </HStack>
          </Box>

          {/* Comodidades */}
          {availableAmenities.length > 0 && (
            <Box>
              <Text mb={2} fontWeight="medium">
                Comodidades
              </Text>
              <CheckboxGroup
                value={localFilters.amenities || []}
                onChange={(values) =>
                  handleFilterChange('amenities', values as string[])
                }
              >
                <VStack align="start" spacing={2}>
                  {availableAmenities.map((amenity) => (
                    <Checkbox key={amenity} value={amenity}>
                      {amenity}
                    </Checkbox>
                  ))}
                </VStack>
              </CheckboxGroup>
            </Box>
          )}

          {/* Ordenação */}
          <Box>
            <Text mb={2} fontWeight="medium">
              Ordenar por
            </Text>
            <HStack>
              <Select
                value={localFilters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                flex={1}
              >
                <option value="price">Preço</option>
                <option value="popularity">Popularidade</option>
                <option value="rating">Avaliação</option>
                <option value="createdAt">Mais Recente</option>
              </Select>
              <Select
                value={localFilters.sortOrder || 'DESC'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                flex={1}
              >
                <option value="ASC">Crescente</option>
                <option value="DESC">Decrescente</option>
              </Select>
            </HStack>
          </Box>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default FiltersBar;

