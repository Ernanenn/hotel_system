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
  HStack,
  useToast,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import SkeletonTable from '../../components/SkeletonTable';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  minPurchaseAmount?: number;
  description?: string;
}

const couponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0, 'Valor deve ser maior ou igual a zero'),
  validFrom: z.string().min(1, 'Data de início é obrigatória'),
  validUntil: z.string().min(1, 'Data de término é obrigatória'),
  maxUses: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.type === 'percentage') {
    return data.value >= 0 && data.value <= 100;
  }
  return data.value > 0;
}, {
  message: 'Valor inválido para o tipo selecionado',
  path: ['value'],
}).refine((data) => {
  const from = new Date(data.validFrom);
  const until = new Date(data.validUntil);
  return until > from;
}, {
  message: 'Data de término deve ser posterior à data de início',
  path: ['validUntil'],
});

type CouponFormData = z.infer<typeof couponSchema>;

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: 'percentage',
      isActive: true,
      maxUses: 0,
    },
  });

  const couponType = watch('type');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons');
      setCoupons(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      if (editingCoupon) {
        await api.patch(`/coupons/${editingCoupon.id}`, data);
        toast({
          title: 'Cupom atualizado',
          description: 'Cupom atualizado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/coupons', data);
        toast({
          title: 'Cupom criado',
          description: 'Cupom criado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      reset();
      setEditingCoupon(null);
      fetchCoupons();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao salvar cupom',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
      maxUses: coupon.maxUses,
      isActive: coupon.isActive,
      minPurchaseAmount: coupon.minPurchaseAmount,
      description: coupon.description,
    });
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      await api.delete(`/coupons/${id}`);
      toast({
        title: 'Cupom excluído',
        description: 'Cupom excluído com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchCoupons();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao excluir cupom',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNew = () => {
    setEditingCoupon(null);
    reset({
      type: 'percentage',
      isActive: true,
      maxUses: 0,
    });
    onOpen();
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) {
      return <Badge colorScheme="red">Inativo</Badge>;
    }

    if (now < validFrom) {
      return <Badge colorScheme="yellow">Aguardando</Badge>;
    }

    if (now > validUntil) {
      return <Badge colorScheme="gray">Expirado</Badge>;
    }

    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      return <Badge colorScheme="orange">Esgotado</Badge>;
    }

    return <Badge colorScheme="green">Ativo</Badge>;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Gerenciar Cupons</Heading>
        <Button colorScheme="brand" onClick={handleNew}>
          Adicionar Cupom
        </Button>
      </Box>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonTable rows={5} columns={8} />
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Código</Th>
                <Th>Tipo</Th>
                <Th>Valor</Th>
                <Th>Válido de</Th>
                <Th>Válido até</Th>
                <Th>Usos</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {coupons.map((coupon) => (
                <Tr key={coupon.id}>
                  <Td fontWeight="bold">{coupon.code}</Td>
                  <Td>{coupon.type === 'percentage' ? 'Percentual' : 'Fixo'}</Td>
                  <Td>
                    {coupon.type === 'percentage'
                      ? `${coupon.value}%`
                      : formatCurrency(coupon.value)}
                  </Td>
                  <Td>{new Date(coupon.validFrom).toLocaleDateString('pt-BR')}</Td>
                  <Td>{new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</Td>
                  <Td>
                    {coupon.maxUses > 0
                      ? `${coupon.currentUses} / ${coupon.maxUses}`
                      : `${coupon.currentUses} (ilimitado)`}
                  </Td>
                  <Td>{getStatusBadge(coupon)}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleEdit(coupon)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(coupon.id)}
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

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingCoupon ? 'Editar Cupom' : 'Adicionar Cupom'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.code}>
                  <FormLabel>Código</FormLabel>
                  <Input {...register('code')} placeholder="PROMO10" />
                  {errors.code && <Text color="red.500">{errors.code.message}</Text>}
                </FormControl>

                <FormControl isInvalid={!!errors.type}>
                  <FormLabel>Tipo</FormLabel>
                  <Select {...register('type')}>
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </Select>
                  {errors.type && <Text color="red.500">{errors.type.message}</Text>}
                </FormControl>

                <FormControl isInvalid={!!errors.value}>
                  <FormLabel>
                    Valor {couponType === 'percentage' ? '(0-100%)' : '(R$)'}
                  </FormLabel>
                  <Input
                    type="number"
                    step={couponType === 'percentage' ? '1' : '0.01'}
                    {...register('value', { valueAsNumber: true })}
                  />
                  {errors.value && <Text color="red.500">{errors.value.message}</Text>}
                </FormControl>

                <FormControl isInvalid={!!errors.validFrom}>
                  <FormLabel>Válido de</FormLabel>
                  <Input type="date" {...register('validFrom')} />
                  {errors.validFrom && (
                    <Text color="red.500">{errors.validFrom.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.validUntil}>
                  <FormLabel>Válido até</FormLabel>
                  <Input type="date" {...register('validUntil')} />
                  {errors.validUntil && (
                    <Text color="red.500">{errors.validUntil.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.maxUses}>
                  <FormLabel>Máximo de usos (0 = ilimitado)</FormLabel>
                  <Input
                    type="number"
                    {...register('maxUses', { valueAsNumber: true })}
                  />
                  {errors.maxUses && (
                    <Text color="red.500">{errors.maxUses.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.minPurchaseAmount}>
                  <FormLabel>Valor mínimo de compra (R$)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('minPurchaseAmount', { valueAsNumber: true })}
                  />
                  {errors.minPurchaseAmount && (
                    <Text color="red.500">{errors.minPurchaseAmount.message}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Input {...register('description')} />
                </FormControl>

                <FormControl>
                  <HStack>
                    <Switch {...register('isActive')} defaultChecked />
                    <FormLabel mb={0}>Cupom ativo</FormLabel>
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="100%"
                  isLoading={isSubmitting}
                >
                  {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminCoupons;

