import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Pagination from '../components/Pagination';
import PushNotificationButton from '../components/PushNotificationButton';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface UserPreferences {
  emailNotifications: boolean;
  reservationConfirmations: boolean;
  reservationReminders: boolean;
  promotionalEmails: boolean;
  smsNotifications: boolean;
  pushNotifications?: boolean;
}

interface Reservation {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  room: {
    number: string;
    type: string;
  };
  payment?: {
    status: string;
  };
}

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsPagination, setReservationsPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [reservationsFilters, setReservationsFilters] = useState({
    status: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchPreferences();
    fetchReservations();
  }, [user, navigate, reservationsFilters]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me');
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/users/me/preferences');
      setPreferences(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar preferências:', err);
    }
  };

  const fetchReservations = async () => {
    try {
      const params = new URLSearchParams();
      if (reservationsFilters.status) {
        params.append('status', reservationsFilters.status);
      }
      params.append('page', reservationsFilters.page.toString());
      params.append('limit', reservationsFilters.limit.toString());

      const response = await api.get(`/users/me/reservations?${params.toString()}`);
      
      if (Array.isArray(response.data)) {
        setReservations(response.data);
        setReservationsPagination({
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
        });
      } else {
        setReservations(response.data.data || []);
        setReservationsPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          totalPages: response.data.totalPages || 0,
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar reservas:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await api.patch('/users/me', updateData);
      setProfile(response.data);
      
      // Atualizar contexto de autenticação
      if (setUser) {
        setUser({
          ...user!,
          ...response.data,
        });
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Seus dados foram atualizados com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Limpar campos de senha
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesChange = async (key: keyof UserPreferences, value: boolean) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await api.patch('/users/me/preferences', { [key]: value });
      toast({
        title: 'Preferências atualizadas',
        description: 'Suas preferências foram atualizadas.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      // Reverter em caso de erro
      setPreferences(preferences);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar preferências.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'yellow',
      confirmed: 'green',
      cancelled: 'red',
      completed: 'blue',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" py={8}>
      <Heading mb={6}>Meu Perfil</Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Tabs>
        <TabList>
          <Tab>Dados Pessoais</Tab>
          <Tab>Histórico de Reservas</Tab>
          <Tab>Preferências</Tab>
          <Tab>Privacidade</Tab>
        </TabList>

        <TabPanels>
          {/* Dados Pessoais */}
          <TabPanel>
            <Card>
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <FormControl isRequired>
                        <FormLabel>Nome</FormLabel>
                        <Input
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Sobrenome</FormLabel>
                        <Input
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                        />
                      </FormControl>
                    </HStack>

                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Telefone</FormLabel>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Nova Senha (deixe em branco para não alterar)</FormLabel>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </FormControl>

                    {formData.password && (
                      <FormControl>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <Input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                          }
                        />
                      </FormControl>
                    )}

                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={saving}
                      loadingText="Salvando..."
                    >
                      Salvar Alterações
                    </Button>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Histórico de Reservas */}
          <TabPanel>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack>
                    <FormControl>
                      <FormLabel>Filtrar por Status</FormLabel>
                      <select
                        value={reservationsFilters.status}
                        onChange={(e) =>
                          setReservationsFilters({
                            ...reservationsFilters,
                            status: e.target.value,
                            page: 1,
                          })
                        }
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                          width: '200px',
                        }}
                      >
                        <option value="">Todos</option>
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="completed">Concluída</option>
                      </select>
                    </FormControl>
                  </HStack>

                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Quarto</Th>
                          <Th>Check-in</Th>
                          <Th>Check-out</Th>
                          <Th>Total</Th>
                          <Th>Status</Th>
                          <Th>Pagamento</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {reservations.map((reservation) => (
                          <Tr key={reservation.id}>
                            <Td>{reservation.room?.number || 'N/A'}</Td>
                            <Td>{new Date(reservation.checkIn).toLocaleDateString('pt-BR')}</Td>
                            <Td>{new Date(reservation.checkOut).toLocaleDateString('pt-BR')}</Td>
                            <Td>{formatCurrency(reservation.totalPrice)}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(reservation.status)}>
                                {getStatusLabel(reservation.status)}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  reservation.payment?.status === 'completed'
                                    ? 'green'
                                    : 'yellow'
                                }
                              >
                                {reservation.payment?.status === 'completed'
                                  ? 'Pago'
                                  : 'Pendente'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>

                  {reservationsPagination.totalPages > 1 && (
                    <Pagination
                      currentPage={reservationsPagination.page}
                      totalPages={reservationsPagination.totalPages}
                      totalItems={reservationsPagination.total}
                      itemsPerPage={reservationsPagination.limit}
                      onPageChange={(page) =>
                        setReservationsFilters({ ...reservationsFilters, page })
                      }
                    />
                  )}

                  {reservations.length === 0 && (
                    <Text textAlign="center" py={8} color="gray.500">
                      Nenhuma reserva encontrada.
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Preferências */}
          <TabPanel>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="lg" fontWeight="bold">
                    Preferências de Notificação
                  </Text>

                  {preferences && (
                    <>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">Notificações por Email</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receber notificações gerais por email
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={preferences.emailNotifications}
                          onChange={(e) =>
                            handlePreferencesChange('emailNotifications', e.target.checked)
                          }
                        />
                      </HStack>

                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">Confirmações de Reserva</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receber email de confirmação ao fazer reserva
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={preferences.reservationConfirmations}
                          onChange={(e) =>
                            handlePreferencesChange('reservationConfirmations', e.target.checked)
                          }
                        />
                      </HStack>

                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">Lembretes de Reserva</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receber lembretes antes do check-in
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={preferences.reservationReminders}
                          onChange={(e) =>
                            handlePreferencesChange('reservationReminders', e.target.checked)
                          }
                        />
                      </HStack>

                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">Emails Promocionais</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receber ofertas e promoções especiais
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={preferences.promotionalEmails}
                          onChange={(e) =>
                            handlePreferencesChange('promotionalEmails', e.target.checked)
                          }
                        />
                      </HStack>

                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">Notificações por SMS</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receber notificações importantes por SMS
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={preferences.smsNotifications}
                          onChange={(e) =>
                            handlePreferencesChange('smsNotifications', e.target.checked)
                          }
                        />
                      </HStack>

                      <Box pt={4} borderTop="1px solid" borderColor="gray.200">
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="medium">Notificações Push</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receber notificações no navegador mesmo quando o app estiver fechado
                          </Text>
                          {user && (
                            <PushNotificationButton
                              userId={user.id}
                              onSubscriptionChange={(subscribed) => {
                                if (preferences) {
                                  setPreferences({
                                    ...preferences,
                                    pushNotifications: subscribed,
                                  });
                                }
                              }}
                            />
                          )}
                        </VStack>
                      </Box>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Privacidade */}
          <TabPanel>
            <Card>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={2}>
                      Exportar Dados
                    </Heading>
                    <Text color="gray.600" mb={4}>
                      Você pode exportar todos os seus dados pessoais em formato JSON ou CSV
                      (conforme GDPR).
                    </Text>
                    <HStack spacing={4}>
                      <Button
                        colorScheme="brand"
                        onClick={async () => {
                          try {
                            const response = await api.get('/users/me/export-data', {
                              params: { format: 'json' },
                            });
                            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                              type: 'application/json',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `meus-dados-${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({
                              title: 'Dados exportados',
                              description: 'Seus dados foram exportados com sucesso.',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });
                          } catch (err: any) {
                            toast({
                              title: 'Erro',
                              description: err.response?.data?.message || 'Erro ao exportar dados',
                              status: 'error',
                              duration: 3000,
                              isClosable: true,
                            });
                          }
                        }}
                      >
                        Exportar JSON
                      </Button>
                      <Button
                        colorScheme="brand"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await api.get('/users/me/export-data', {
                              params: { format: 'csv' },
                            });
                            const blob = new Blob([response.data.data], {
                              type: 'text/csv',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = response.data.filename || `meus-dados-${Date.now()}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({
                              title: 'Dados exportados',
                              description: 'Seus dados foram exportados com sucesso.',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });
                          } catch (err: any) {
                            toast({
                              title: 'Erro',
                              description: err.response?.data?.message || 'Erro ao exportar dados',
                              status: 'error',
                              duration: 3000,
                              isClosable: true,
                            });
                          }
                        }}
                      >
                        Exportar CSV
                      </Button>
                    </HStack>
                  </Box>

                  <Box pt={4} borderTop="1px solid" borderColor="gray.200">
                    <Heading size="md" mb={2} color="red.600">
                      Excluir Conta
                    </Heading>
                    <Text color="gray.600" mb={4}>
                      Ao excluir sua conta, todos os seus dados pessoais serão anonimizados.
                      Reservas e avaliações serão mantidas para fins de histórico, mas sem
                      identificação pessoal.
                    </Text>
                    <Alert status="warning" mb={4}>
                      <AlertIcon />
                      Esta ação é irreversível. Certifique-se de exportar seus dados antes de
                      excluir a conta.
                    </Alert>
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        if (
                          confirm(
                            'Tem certeza que deseja excluir sua conta? Esta ação é irreversível. Certifique-se de ter exportado seus dados antes de continuar.',
                          )
                        ) {
                          if (
                            confirm(
                              'Última confirmação: Você realmente deseja excluir sua conta?',
                            )
                          ) {
                            api
                              .delete('/users/me/account')
                              .then(() => {
                                toast({
                                  title: 'Conta excluída',
                                  description:
                                    'Sua conta foi excluída e seus dados foram anonimizados.',
                                  status: 'success',
                                  duration: 5000,
                                  isClosable: true,
                                });
                                logout();
                                navigate('/');
                              })
                              .catch((err: any) => {
                                toast({
                                  title: 'Erro',
                                  description:
                                    err.response?.data?.message || 'Erro ao excluir conta',
                                  status: 'error',
                                  duration: 3000,
                                  isClosable: true,
                                });
                              });
                          }
                        }
                      }}
                    >
                      Excluir Minha Conta
                    </Button>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Profile;

