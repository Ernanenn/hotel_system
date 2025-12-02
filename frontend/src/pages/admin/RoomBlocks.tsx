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
  Select,
  Textarea,
  Switch,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import SkeletonTable from '../../components/SkeletonTable';

interface RoomBlock {
  id: string;
  roomId: string;
  room: {
    id: string;
    number: string;
    type: string;
  };
  startDate: string;
  endDate: string;
  type: 'maintenance' | 'event' | 'other';
  reason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  number: string;
  type: string;
}

const blockSchema = z.object({
  roomId: z.string().min(1, 'Quarto é obrigatório'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  type: z.enum(['maintenance', 'event', 'other']),
  reason: z.string().optional(),
  isActive: z.boolean().optional(),
});

type BlockFormData = z.infer<typeof blockSchema>;

const AdminRoomBlocks = () => {
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingBlock, setEditingBlock] = useState<RoomBlock | null>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<BlockFormData>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      isActive: true,
      type: 'maintenance',
    },
  });

  const startDate = watch('startDate');

  useEffect(() => {
    fetchBlocks();
    fetchRooms();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/room-blocks');
      setBlocks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar bloqueios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/all');
      setRooms(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar quartos:', err);
    }
  };

  const onSubmit = async (data: BlockFormData) => {
    try {
      if (editingBlock) {
        await api.patch(`/room-blocks/${editingBlock.id}`, data);
        toast({
          title: 'Bloqueio atualizado',
          description: 'Bloqueio atualizado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/room-blocks', data);
        toast({
          title: 'Bloqueio criado',
          description: 'Bloqueio criado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      reset();
      setEditingBlock(null);
      fetchBlocks();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao salvar bloqueio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (block: RoomBlock) => {
    setEditingBlock(block);
    reset({
      roomId: block.roomId,
      startDate: block.startDate.split('T')[0],
      endDate: block.endDate.split('T')[0],
      type: block.type,
      reason: block.reason || '',
      isActive: block.isActive,
    });
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) return;

    try {
      await api.delete(`/room-blocks/${id}`);
      toast({
        title: 'Bloqueio excluído',
        description: 'Bloqueio excluído com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBlocks();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao excluir bloqueio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNew = () => {
    setEditingBlock(null);
    reset({
      isActive: true,
      type: 'maintenance',
    });
    onOpen();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      maintenance: 'Manutenção',
      event: 'Evento',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      maintenance: 'orange',
      event: 'purple',
      other: 'gray',
    };
    return colors[type] || 'gray';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Gerenciar Bloqueios de Quartos</Heading>
        <Button colorScheme="brand" onClick={handleNew}>
          Adicionar Bloqueio
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
                <Th>Quarto</Th>
                <Th>Data Início</Th>
                <Th>Data Fim</Th>
                <Th>Tipo</Th>
                <Th>Motivo</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {blocks.map((block) => (
                <Tr key={block.id}>
                  <Td fontWeight="bold">
                    {block.room?.number || 'N/A'} ({block.room?.type || 'N/A'})
                  </Td>
                  <Td>{new Date(block.startDate).toLocaleDateString('pt-BR')}</Td>
                  <Td>{new Date(block.endDate).toLocaleDateString('pt-BR')}</Td>
                  <Td>
                    <Badge colorScheme={getTypeColor(block.type)}>
                      {getTypeLabel(block.type)}
                    </Badge>
                  </Td>
                  <Td>{block.reason || '-'}</Td>
                  <Td>
                    {block.isActive ? (
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
                        onClick={() => handleEdit(block)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(block.id)}
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
            {editingBlock ? 'Editar Bloqueio' : 'Adicionar Bloqueio'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.roomId}>
                  <FormLabel>Quarto</FormLabel>
                  <Select {...register('roomId')} placeholder="Selecione um quarto">
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Quarto {room.number} - {room.type}
                      </option>
                    ))}
                  </Select>
                  {errors.roomId && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.roomId.message}
                    </Box>
                  )}
                </FormControl>

                <HStack spacing={2} w="100%">
                  <FormControl isInvalid={!!errors.startDate}>
                    <FormLabel>Data de Início</FormLabel>
                    <Input type="date" {...register('startDate')} />
                    {errors.startDate && (
                      <Box color="red.500" fontSize="sm" mt={1}>
                        {errors.startDate.message}
                      </Box>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.endDate}>
                    <FormLabel>Data de Fim</FormLabel>
                    <Input
                      type="date"
                      {...register('endDate')}
                      min={startDate}
                    />
                    {errors.endDate && (
                      <Box color="red.500" fontSize="sm" mt={1}>
                        {errors.endDate.message}
                      </Box>
                    )}
                  </FormControl>
                </HStack>

                <FormControl isInvalid={!!errors.type}>
                  <FormLabel>Tipo de Bloqueio</FormLabel>
                  <Select {...register('type')}>
                    <option value="maintenance">Manutenção</option>
                    <option value="event">Evento</option>
                    <option value="other">Outro</option>
                  </Select>
                  {errors.type && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.type.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <Textarea {...register('reason')} rows={3} />
                </FormControl>

                <FormControl>
                  <HStack>
                    <Switch {...register('isActive')} defaultChecked />
                    <FormLabel mb={0}>Bloqueio ativo</FormLabel>
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="100%"
                  isLoading={isSubmitting}
                >
                  {editingBlock ? 'Atualizar' : 'Criar'} Bloqueio
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminRoomBlocks;

