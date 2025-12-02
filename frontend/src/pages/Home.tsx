import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  HStack,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Home = () => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const handleSearch = () => {
    if (checkIn && checkOut) {
      navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
    } else {
      navigate('/rooms');
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Set minimum date to today
  const minDate = today;

  return (
    <Container maxW="1200px" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" py={12}>
          <Heading size="2xl" mb={4} color="brand.600">
            Bem-vindo ao Hotel Management
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Encontre o quarto perfeito para sua estadia
          </Text>
        </Box>

        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          shadow="md"
          maxW="600px"
          mx="auto"
          w="100%"
        >
          <VStack spacing={4}>
            <HStack w="100%" spacing={4}>
              <FormControl>
                <FormLabel>Check-in</FormLabel>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={minDate}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Check-out</FormLabel>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || minDate}
                />
              </FormControl>
            </HStack>
            <Button
              colorScheme="brand"
              size="lg"
              w="100%"
              onClick={handleSearch}
              isDisabled={!checkIn || !checkOut}
            >
              Buscar Quartos
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Home;

