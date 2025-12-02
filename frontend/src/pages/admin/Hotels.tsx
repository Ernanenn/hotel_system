import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
  Switch,
  Textarea,
  Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import SkeletonTable from '../../components/SkeletonTable';

interface Hotel {
  id: string;
  name: string;
  subdomain?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const hotelSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  subdomain: z.string().optional(),
  address: z.string().min(1, 'Endereço é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  zipCode: z.string().min(1, 'CEP é obrigatório'),
  country: z.string().min(1, 'País é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type HotelFormData = z.infer<typeof hotelSchema>;

const AdminHotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hotels');
      setHotels(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar hotéis');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: HotelFormData) => {
    try {
      // Limpar campos vazios
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== ''),
      );

      if (editingHotel) {
        await api.patch(`/hotels/${editingHotel.id}`, cleanData);
        toast({
          title: 'Hotel atualizado',
          description: 'Hotel atualizado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/hotels', cleanData);
        toast({
          title: 'Hotel criado',
          description: 'Hotel criado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      reset();
      setEditingHotel(null);
      fetchHotels();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao salvar hotel',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    reset({
      name: hotel.name,
      subdomain: hotel.subdomain || '',
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      zipCode: hotel.zipCode,
      country: hotel.country,
      phone: hotel.phone || '',
      email: hotel.email || '',
      website: hotel.website || '',
      description: hotel.description || '',
      isActive: hotel.isActive,
    });
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este hotel?')) return;

    try {
      await api.delete(`/hotels/${id}`);
      toast({
        title: 'Hotel excluído',
        description: 'Hotel excluído com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchHotels();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao excluir hotel',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNew = () => {
    setEditingHotel(null);
    reset({
      isActive: true,
    });
    onOpen();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Gerenciar Hotéis</Heading>
        <Button colorScheme="brand" onClick={handleNew}>
          Adicionar Hotel
        </Button>
      </Box>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Subdomínio</Th>
                <Th>Cidade</Th>
                <Th>País</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {hotels.map((hotel) => (
                <Tr key={hotel.id}>
                  <Td fontWeight="bold">{hotel.name}</Td>
                  <Td>{hotel.subdomain || '-'}</Td>
                  <Td>{hotel.city}, {hotel.state}</Td>
                  <Td>{hotel.country}</Td>
                  <Td>
                    {hotel.isActive ? (
                      <Badge colorScheme="green">Ativo</Badge>
                    ) : (
                      <Badge colorScheme="red">Inativo</Badge>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleEdit(hotel)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(hotel.id)}
                      >
                        Excluir
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingHotel ? 'Editar Hotel' : 'Adicionar Hotel'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Nome</FormLabel>
                  <Input {...register('name')} placeholder="Hotel Exemplo" />
                  {errors.name && <Text color="red.500">{errors.name.message}</Text>}
                </FormControl>

                <FormControl isInvalid={!!errors.subdomain}>
                  <FormLabel>Subdomínio (opcional)</FormLabel>
                  <Input
                    {...register('subdomain')}
                    placeholder="hotel1"
                  />
                  {errors.subdomain && (
                    <Text color="red.500">{errors.subdomain.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.address}>
                  <FormLabel>Endereço</FormLabel>
                  <Input {...register('address')} placeholder="Rua Exemplo, 123" />
                  {errors.address && (
                    <Text color="red.500">{errors.address.message}</Text>
                  )}
                </FormControl>

                <HStack spacing={2} w="100%">
                  <FormControl isInvalid={!!errors.city}>
                    <FormLabel>Cidade</FormLabel>
                    <Input {...register('city')} placeholder="São Paulo" />
                    {errors.city && (
                      <Text color="red.500">{errors.city.message}</Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.state}>
                    <FormLabel>Estado</FormLabel>
                    <Input {...register('state')} placeholder="SP" />
                    {errors.state && (
                      <Text color="red.500">{errors.state.message}</Text>
                    )}
                  </FormControl>
                </HStack>

                <HStack spacing={2} w="100%">
                  <FormControl isInvalid={!!errors.zipCode}>
                    <FormLabel>CEP</FormLabel>
                    <Input {...register('zipCode')} placeholder="01234-567" />
                    {errors.zipCode && (
                      <Text color="red.500">{errors.zipCode.message}</Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.country}>
                    <FormLabel>País</FormLabel>
                    <Input {...register('country')} placeholder="Brasil" />
                    {errors.country && (
                      <Text color="red.500">{errors.country.message}</Text>
                    )}
                  </FormControl>
                </HStack>

                <HStack spacing={2} w="100%">
                  <FormControl isInvalid={!!errors.phone}>
                    <FormLabel>Telefone</FormLabel>
                    <Input {...register('phone')} placeholder="(11) 1234-5678" />
                    {errors.phone && (
                      <Text color="red.500">{errors.phone.message}</Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      {...register('email')}
                      placeholder="contato@hotel.com"
                    />
                    {errors.email && (
                      <Text color="red.500">{errors.email.message}</Text>
                    )}
                  </FormControl>
                </HStack>

                <FormControl isInvalid={!!errors.website}>
                  <FormLabel>Website</FormLabel>
                  <Input
                    {...register('website')}
                    placeholder="https://www.hotel.com"
                  />
                  {errors.website && (
                    <Text color="red.500">{errors.website.message}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea {...register('description')} rows={4} />
                </FormControl>

                <FormControl>
                  <HStack>
                    <Switch {...register('isActive')} defaultChecked />
                    <FormLabel mb={0}>Hotel ativo</FormLabel>
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="100%"
                  isLoading={isSubmitting}
                >
                  {editingHotel ? 'Atualizar' : 'Criar'} Hotel
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminHotels;

