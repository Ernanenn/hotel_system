import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Box,
  Heading,
  Select,
  HStack,
  Button,
  Text,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    roomId: string;
    roomNumber: string;
    status: 'reserved' | 'maintenance' | 'blocked';
    reservationId?: string;
  };
}

interface Room {
  id: string;
  number: string;
  type: string;
}

const RoomCalendar = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>('month');

  const localizer = momentLocalizer(require('moment'));

  // Carregar quartos
  useMemo(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms');
        setRooms(response.data);
      } catch (err: any) {
        console.error('Erro ao carregar quartos:', err);
      }
    };
    fetchRooms();
  }, []);

  // Carregar eventos do calendário
  useMemo(() => {
    const fetchEvents = async () => {
      if (user?.role !== 'admin') return;

      try {
        setLoading(true);
        setError('');

        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);

        const params: any = {
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
        };

        if (selectedRoom !== 'all') {
          params.roomId = selectedRoom;
        }

        const response = await api.get('/rooms/availability/calendar', {
          params,
        });

        // Converter dados para eventos do calendário
        const calendarEvents: CalendarEvent[] = response.data.map((item: any) => {
          const date = new Date(item.date);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          let title = `Quarto ${item.roomNumber}`;
          let status: 'reserved' | 'maintenance' | 'blocked' = 'reserved';

          if (item.status === 'reserved') {
            title = `Reservado - Quarto ${item.roomNumber}`;
            status = 'reserved';
          } else if (item.status === 'maintenance') {
            title = `Manutenção - Quarto ${item.roomNumber}`;
            status = 'maintenance';
          } else if (item.status === 'blocked') {
            title = `Bloqueado - Quarto ${item.roomNumber}`;
            status = 'blocked';
          }

          return {
            id: `${item.roomId}-${item.date}`,
            title,
            start: date,
            end: nextDate,
            resource: {
              roomId: item.roomId,
              roomNumber: item.roomNumber,
              status,
              reservationId: item.reservationId,
            },
          };
        });

        setEvents(calendarEvents);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar calendário');
        toast({
          title: 'Erro',
          description: 'Erro ao carregar calendário de disponibilidade',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate, selectedRoom, user, toast]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';

    if (event.resource.status === 'reserved') {
      backgroundColor = '#d32f2f';
      borderColor = '#d32f2f';
    } else if (event.resource.status === 'maintenance') {
      backgroundColor = '#f57c00';
      borderColor = '#f57c00';
    } else if (event.resource.status === 'blocked') {
      backgroundColor = '#616161';
      borderColor = '#616161';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: '#fff',
        borderRadius: '4px',
        border: 'none',
        padding: '2px 4px',
      },
    };
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (user?.role !== 'admin') {
    return (
      <Alert status="warning">
        <AlertIcon />
        Acesso restrito a administradores.
      </Alert>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Calendário de Disponibilidade</Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <HStack mb={4} spacing={4} flexWrap="wrap">
        <Select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          maxW="300px"
        >
          <option value="all">Todos os quartos</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              Quarto {room.number} - {room.type}
            </option>
          ))}
        </Select>

        <HStack>
          <Button onClick={handlePrevMonth} size="sm">
            ← Mês Anterior
          </Button>
          <Text fontWeight="bold" minW="200px" textAlign="center">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <Button onClick={handleNextMonth} size="sm">
            Próximo Mês →
          </Button>
        </HStack>
      </HStack>

      <HStack mb={4} spacing={2}>
        <Badge colorScheme="red">Reservado</Badge>
        <Badge colorScheme="orange">Manutenção</Badge>
        <Badge colorScheme="gray">Bloqueado</Badge>
        <Badge colorScheme="blue">Disponível</Badge>
      </HStack>

      {loading ? (
        <Box textAlign="center" py={12}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Box height="600px" bg="white" p={4} borderRadius="md" shadow="sm">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={handleNavigate}
            eventPropGetter={eventStyleGetter}
            messages={{
              next: 'Próximo',
              previous: 'Anterior',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'Nenhum evento neste período',
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default RoomCalendar;

