import {
  Box,
  Heading,
  Text,
  VStack,
  Container,
  Divider,
} from '@chakra-ui/react';

const PrivacyPolicy = () => {
  return (
    <Container maxW="800px" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="xl">Política de Privacidade</Heading>
        <Text color="gray.600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</Text>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>
            1. Coleta de Dados
          </Heading>
          <Text>
            Coletamos os seguintes dados pessoais quando você se cadastra e usa nosso serviço:
          </Text>
          <VStack align="start" spacing={2} mt={3} ml={4}>
            <Text>• Nome completo</Text>
            <Text>• Endereço de e-mail</Text>
            <Text>• Número de telefone (opcional)</Text>
            <Text>• Dados de reservas e pagamentos</Text>
            <Text>• Preferências de notificação</Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            2. Uso dos Dados
          </Heading>
          <Text>
            Utilizamos seus dados pessoais para:
          </Text>
          <VStack align="start" spacing={2} mt={3} ml={4}>
            <Text>• Processar e gerenciar suas reservas</Text>
            <Text>• Enviar confirmações e notificações</Text>
            <Text>• Melhorar nossos serviços</Text>
            <Text>• Cumprir obrigações legais</Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            3. Compartilhamento de Dados
          </Heading>
          <Text>
            Não compartilhamos seus dados pessoais com terceiros, exceto quando necessário para:
          </Text>
          <VStack align="start" spacing={2} mt={3} ml={4}>
            <Text>• Processar pagamentos</Text>
            <Text>• Cumprir obrigações legais</Text>
            <Text>• Proteger nossos direitos e segurança</Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            4. Seus Direitos (LGPD/GDPR)
          </Heading>
          <Text>
            Você tem o direito de:
          </Text>
          <VStack align="start" spacing={2} mt={3} ml={4}>
            <Text>• Acessar seus dados pessoais</Text>
            <Text>• Corrigir dados incorretos</Text>
            <Text>• Solicitar a exclusão de seus dados</Text>
            <Text>• Exportar seus dados em formato legível</Text>
            <Text>• Revogar consentimento a qualquer momento</Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            5. Segurança
          </Heading>
          <Text>
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados
            pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            6. Retenção de Dados
          </Heading>
          <Text>
            Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir os propósitos
            descritos nesta política, a menos que um período de retenção mais longo seja exigido
            por lei.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            7. Contato
          </Heading>
          <Text>
            Para exercer seus direitos ou fazer perguntas sobre esta política de privacidade,
            entre em contato conosco através do e-mail: privacidade@hotel.com
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default PrivacyPolicy;

