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
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      // Erro será tratado pelo AuthContext
      console.error('Erro ao fazer login:', err);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box bg="white" p={8} borderRadius="lg" shadow="md">
        <VStack spacing={6} align="stretch">
          <Heading size="lg" textAlign="center">
            Entrar
          </Heading>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  {...register('email')}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Senha</FormLabel>
                <Input
                  type="password"
                  {...register('password')}
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                w="100%"
                isLoading={isSubmitting}
              >
                Entrar
              </Button>
            </VStack>
          </form>

          <Text textAlign="center">
            Não tem uma conta?{' '}
            <Link as={RouterLink} to="/register" color="brand.500">
              Cadastre-se
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;

