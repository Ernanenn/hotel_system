import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link,
  Alert,
  AlertIcon,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { registerSchema, type RegisterFormData } from '../schemas/auth.schema';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      navigate('/');
    } catch (err: any) {
      // Erro será tratado pelo AuthContext
      console.error('Erro ao cadastrar:', err);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box bg="white" p={8} borderRadius="lg" shadow="md">
        <VStack spacing={6} align="stretch">
          <Heading size="lg" textAlign="center">
            Cadastrar
          </Heading>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel>Nome</FormLabel>
                <Input {...register('firstName')} />
                <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel>Sobrenome</FormLabel>
                <Input {...register('lastName')} />
                <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input type="email" {...register('email')} />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.phone}>
                <FormLabel>Telefone</FormLabel>
                <Input {...register('phone')} />
                <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Senha</FormLabel>
                <Input type="password" {...register('password')} />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                w="100%"
                isLoading={isSubmitting}
              >
                Cadastrar
              </Button>
            </VStack>
          </form>

          <Text textAlign="center">
            Já tem uma conta?{' '}
            <Link as={RouterLink} to="/login" color="brand.500">
              Entrar
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register;

