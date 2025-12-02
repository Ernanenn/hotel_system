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
  Select,
  VStack,
  Image,
} from '@chakra-ui/react';
import api from '../../services/api';
import { RoomType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import ImageUpload from '../../components/ImageUpload';
import SkeletonTable from '../../components/SkeletonTable';

interface Room {
  id: string;
  number: string;
  type: RoomType;
  pricePerNight: number;
  description: string;
  amenities: string[];
  isAvailable: boolean;
  maxOccupancy: number;
  imageUrl?: string | null;
}

const AdminRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState<Partial<Room>>({
    number: '',
    type: RoomType.DOUBLE,
    pricePerNight: 0,
    description: '',
    amenities: [],
    maxOccupancy: 2,
    imageUrl: null,
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar quartos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomData = { ...formData };
      if (!roomData.imageUrl) {
        delete roomData.imageUrl;
      }
      await api.post('/rooms', roomData);
      onClose();
      fetchRooms();
      setFormData({
        number: '',
        type: RoomType.DOUBLE,
        pricePerNight: 0,
        description: '',
        amenities: [],
        maxOccupancy: 2,
        imageUrl: null,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar quarto');
    }
  };

  const getRoomTypeLabel = (type: RoomType) => {
    const labels = {
      single: 'Solteiro',
      double: 'Casal',
      suite: 'Suíte',
      deluxe: 'Deluxe',
    };
    return labels[type] || type;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Gerenciar Quartos</Heading>
        <Button colorScheme="brand" onClick={onOpen}>
          Adicionar Quarto
        </Button>
      </Box>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonTable rows={5} columns={7} />
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Imagem</Th>
              <Th>Número</Th>
              <Th>Tipo</Th>
              <Th>Preço/Noite</Th>
              <Th>Capacidade</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rooms.map((room) => (
              <Tr key={room.id}>
                <Td>
                  {room.imageUrl ? (
                    <Image
                      src={room.imageUrl}
                      alt={room.number}
                      boxSize="50px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                  )}
                </Td>
                <Td>{room.number}</Td>
                <Td>{getRoomTypeLabel(room.type)}</Td>
                <Td>{formatCurrency(room.pricePerNight)}</Td>
                <Td>{room.maxOccupancy}</Td>
                <Td>
                  <Badge colorScheme={room.isAvailable ? 'green' : 'red'}>
                    {room.isAvailable ? 'Disponível' : 'Indisponível'}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => {
                      setEditingRoom(room);
                      onEditOpen();
                    }}
                  >
                    Editar Imagem
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Quarto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Número do Quarto</FormLabel>
                  <Input
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as RoomType })
                    }
                  >
                    <option value={RoomType.SINGLE}>Solteiro</option>
                    <option value={RoomType.DOUBLE}>Casal</option>
                    <option value={RoomType.SUITE}>Suíte</option>
                    <option value={RoomType.DELUXE}>Deluxe</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Preço por Noite</FormLabel>
                  <Input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerNight: parseFloat(e.target.value),
                      })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Capacidade Máxima</FormLabel>
                  <Input
                    type="number"
                    value={formData.maxOccupancy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxOccupancy: parseInt(e.target.value),
                      })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Imagem do Quarto</FormLabel>
                  <ImageUpload
                    value={formData.imageUrl || null}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url || undefined })}
                  />
                </FormControl>

                <Button type="submit" colorScheme="brand" w="100%">
                  Criar Quarto
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Imagem do Quarto {editingRoom?.number}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingRoom && (
              <VStack spacing={4}>
                <ImageUpload
                  value={editingRoom.imageUrl || null}
                  onChange={async (url) => {
                    // O upload/deleção já é feito pelo componente
                    // Aguardar um pouco para garantir que a operação foi concluída
                    setTimeout(async () => {
                      await fetchRooms();
                      if (!url) {
                        onEditClose();
                      }
                    }, 500);
                  }}
                  roomId={editingRoom.id}
                />
                <Button onClick={onEditClose} w="100%">
                  Fechar
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminRooms;

