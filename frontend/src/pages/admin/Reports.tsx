import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Select,
  Button,
  Card,
  CardBody,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

interface RevenueData {
  period: string;
  totalRevenue: number;
  reservationCount: number;
  averageRevenue: number;
}

interface RevenueReport {
  data: RevenueData[];
  summary: {
    totalRevenue: number;
    totalReservations: number;
    averageRevenue: number;
    groupBy: string;
  };
}

interface OccupancyData {
  roomId: string;
  roomNumber: string;
  roomType: string;
  totalDays: number;
  occupiedDays: number;
  occupancyRate: number;
  reservationCount: number;
}

interface OccupancyReport {
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  rooms: OccupancyData[];
  summary: {
    totalRooms: number;
    totalAvailableDays: number;
    totalOccupiedDays: number;
    overallOccupancyRate: number;
  };
}

interface PopularRoom {
  id: string;
  number: string;
  type: string;
  pricePerNight: number;
  ratingAverage: number;
  reservationCount: number;
  reviewCount: number;
  totalRevenue: number;
}

interface Statistics {
  totalRooms: number;
  totalReservations: number;
  totalRevenue: number;
  totalUsers: number;
  occupancyRate: number;
  averageRating: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [occupancyReport, setOccupancyReport] = useState<OccupancyReport | null>(null);
  const [popularRooms, setPopularRooms] = useState<PopularRoom[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'day',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [revenueRes, occupancyRes, popularRes, statsRes] = await Promise.all([
        api.get('/reports/revenue', { params: filters }),
        api.get('/reports/occupancy', {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }),
        api.get('/reports/popular-rooms', { params: { limit: 10 } }),
        api.get('/reports/statistics'),
      ]);

      setRevenueReport(revenueRes.data);
      setOccupancyReport(occupancyRes.data);
      setPopularRooms(popularRes.data);
      setStatistics(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await api.get(`/reports/revenue/export/${format}`, {
        params: filters,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-receita.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Exportação realizada',
        description: `Relatório exportado com sucesso em formato ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: 'Erro na exportação',
        description: err.response?.data?.message || 'Erro ao exportar relatório',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Relatórios</Heading>
        <HStack>
          <Button colorScheme="green" onClick={() => handleExport('excel')}>
            Exportar Excel
          </Button>
          <Button colorScheme="red" onClick={() => handleExport('pdf')}>
            Exportar PDF
          </Button>
        </HStack>
      </HStack>

      {/* Filtros */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <Box flex={1}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Data Início
              </Text>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                }}
              />
            </Box>
            <Box flex={1}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Data Fim
              </Text>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                }}
              />
            </Box>
            <Box flex={1}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Agrupar por
              </Text>
              <Select
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mês</option>
                <option value="year">Ano</option>
                <option value="room">Quarto</option>
                <option value="type">Tipo</option>
              </Select>
            </Box>
          </HStack>
        </CardBody>
      </Card>

      {/* Estatísticas Gerais */}
      {statistics && (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
          <Stat>
            <StatLabel>Total Quartos</StatLabel>
            <StatNumber>{statistics.totalRooms}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Reservas</StatLabel>
            <StatNumber>{statistics.totalReservations}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Receita Total</StatLabel>
            <StatNumber fontSize="lg">{formatCurrency(statistics.totalRevenue)}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Usuários</StatLabel>
            <StatNumber>{statistics.totalUsers}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Taxa de Ocupação</StatLabel>
            <StatNumber>{statistics.occupancyRate.toFixed(1)}%</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Avaliação Média</StatLabel>
            <StatNumber>{statistics.averageRating.toFixed(1)}</StatNumber>
            <StatHelpText>de 5 estrelas</StatHelpText>
          </Stat>
        </SimpleGrid>
      )}

      {/* Gráfico de Receita */}
      {revenueReport && revenueReport.data.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Receita por {filters.groupBy === 'day' ? 'Dia' : filters.groupBy === 'week' ? 'Semana' : filters.groupBy === 'month' ? 'Mês' : filters.groupBy === 'year' ? 'Ano' : filters.groupBy === 'room' ? 'Quarto' : 'Tipo'}
            </Heading>
            <Box h="300px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueReport.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#8884d8"
                    name="Receita Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="averageRevenue"
                    stroke="#82ca9d"
                    name="Receita Média"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Box mt={4}>
              <Text fontWeight="bold">Resumo:</Text>
              <Text>
                Receita Total: {formatCurrency(revenueReport.summary.totalRevenue)} | Total de
                Reservas: {revenueReport.summary.totalReservations} | Receita Média:{' '}
                {formatCurrency(revenueReport.summary.averageRevenue)}
              </Text>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Gráfico de Ocupação */}
      {occupancyReport && occupancyReport.rooms.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Taxa de Ocupação por Quarto
            </Heading>
            <Box h="300px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyReport.rooms.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="roomNumber" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="occupancyRate" fill="#8884d8" name="Taxa de Ocupação (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box mt={4}>
              <Text fontWeight="bold">Resumo:</Text>
              <Text>
                Taxa de Ocupação Geral: {occupancyReport.summary.overallOccupancyRate.toFixed(1)}% |
                Total de Quartos: {occupancyReport.summary.totalRooms} | Dias Ocupados:{' '}
                {occupancyReport.summary.totalOccupiedDays} /{' '}
                {occupancyReport.summary.totalAvailableDays}
              </Text>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Quartos Mais Populares */}
      {popularRooms.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Quartos Mais Populares
            </Heading>
            <Box h="300px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularRooms} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="number" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reservationCount" fill="#8884d8" name="Nº Reservas" />
                  <Bar dataKey="totalRevenue" fill="#82ca9d" name="Receita Total" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Distribuição por Tipo de Quarto */}
      {revenueReport && filters.groupBy === 'type' && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Distribuição de Receita por Tipo
            </Heading>
            <Box h="300px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueReport.data}
                    dataKey="totalRevenue"
                    nameKey="period"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {revenueReport.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Tabela de Quartos Populares */}
      {popularRooms.length > 0 && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Detalhes dos Quartos Mais Populares
            </Heading>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Quarto</Th>
                    <Th>Tipo</Th>
                    <Th>Preço/Noite</Th>
                    <Th>Nº Reservas</Th>
                    <Th>Nº Avaliações</Th>
                    <Th>Avaliação Média</Th>
                    <Th>Receita Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {popularRooms.map((room) => (
                    <Tr key={room.id}>
                      <Td>{room.number}</Td>
                      <Td>{room.type}</Td>
                      <Td>{formatCurrency(room.pricePerNight)}</Td>
                      <Td>{room.reservationCount}</Td>
                      <Td>{room.reviewCount}</Td>
                      <Td>{room.ratingAverage.toFixed(1)}</Td>
                      <Td>{formatCurrency(room.totalRevenue)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default Reports;

