import { FixedSizeGrid as Grid } from 'react-window';
import { Box, SimpleGrid, useBreakpointValue } from '@chakra-ui/react';
import RoomCard from './RoomCard';
import { Room } from '../types/room';

interface VirtualizedRoomListProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
  checkIn?: string | null;
  checkOut?: string | null;
}

const VirtualizedRoomList = ({ rooms, onRoomClick, checkIn, checkOut }: VirtualizedRoomListProps) => {
  // Calcular número de colunas baseado no breakpoint
  const columns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 }) || 3;
  const rowHeight = 400; // Altura estimada de cada card
  const columnWidth = useBreakpointValue({ base: '100%', md: '50%', lg: '33.33%', xl: '25%' }) || '33.33%';
  
  // Calcular número de linhas
  const rowCount = Math.ceil(rooms.length / columns);
  
  // Altura total do grid
  const gridHeight = Math.min(rowCount * rowHeight, 800); // Máximo de 800px

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columns + columnIndex;
    
    if (index >= rooms.length) {
      return <div style={style} />;
    }

    const room = rooms[index];

    return (
      <Box style={style} p={2}>
        <RoomCard
          room={room}
          onClick={() => onRoomClick(room)}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      </Box>
    );
  };

  // Se houver poucos itens, usar renderização normal
  if (rooms.length <= 12) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() => onRoomClick(room)}
            checkIn={checkIn}
            checkOut={checkOut}
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Box width="100%" height={gridHeight}>
      <Grid
        columnCount={columns}
        columnWidth={typeof columnWidth === 'string' ? parseInt(columnWidth) : columnWidth}
        height={gridHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width="100%"
      >
        {Cell}
      </Grid>
    </Box>
  );
};

export default VirtualizedRoomList;

