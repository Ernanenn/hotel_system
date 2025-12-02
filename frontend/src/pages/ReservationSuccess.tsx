import { useParams, Link } from 'react-router-dom';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Card,
  CardBody,
} from '@chakra-ui/react';

const ReservationSuccess = () => {

  return (
    <Box maxW="600px" mx="auto" textAlign="center">
      <VStack spacing={6}>
        <Alert status="success">
          <AlertIcon />
          Reserva confirmada com sucesso!
        </Alert>

        <Heading>Obrigado pela sua reserva!</Heading>

        <Card>
          <CardBody>
            <Text>
              Você receberá um e-mail de confirmação em breve com todos os detalhes da sua reserva.
            </Text>
          </CardBody>
        </Card>

        <VStack spacing={3}>
          <Link to="/my-reservations">
            <Button colorScheme="brand">Ver Minhas Reservas</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Voltar ao Início</Button>
          </Link>
        </VStack>
      </VStack>
    </Box>
  );
};

export default ReservationSuccess;

