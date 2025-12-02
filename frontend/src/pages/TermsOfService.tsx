import {
  Box,
  Heading,
  Text,
  VStack,
  Container,
  Divider,
} from '@chakra-ui/react';

const TermsOfService = () => {
  return (
    <Container maxW="800px" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="xl">Termos de Uso</Heading>
        <Text color="gray.600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</Text>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>
            1. Aceitação dos Termos
          </Heading>
          <Text>
            Ao acessar e usar este serviço, você concorda em cumprir e estar vinculado aos seguintes
            termos e condições de uso.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            2. Uso do Serviço
          </Heading>
          <Text>
            Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos.
            Você não deve:
          </Text>
          <VStack align="start" spacing={2} mt={3} ml={4}>
            <Text>• Usar o serviço de forma fraudulenta ou enganosa</Text>
            <Text>• Tentar acessar áreas restritas do sistema</Text>
            <Text>• Interferir ou interromper o funcionamento do serviço</Text>
            <Text>• Transmitir vírus ou código malicioso</Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            3. Reservas e Pagamentos
          </Heading>
          <Text>
            Ao fazer uma reserva, você concorda em:
          </Text>
          <VStack align="start" spacing={2} mt={3} ml={4}>
            <Text>• Fornecer informações precisas e atualizadas</Text>
            <Text>• Pagar o valor total da reserva</Text>
            <Text>• Respeitar as políticas de cancelamento</Text>
            <Text>• Comparecer no check-in na data agendada</Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            4. Política de Cancelamento
          </Heading>
          <Text>
            Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência. Cancelamentos
            tardios podem estar sujeitos a taxas conforme nossa política de cancelamento.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            5. Propriedade Intelectual
          </Heading>
          <Text>
            Todo o conteúdo do serviço, incluindo textos, gráficos, logotipos e software, é
            propriedade do hotel e está protegido por leis de direitos autorais.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            6. Limitação de Responsabilidade
          </Heading>
          <Text>
            O hotel não será responsável por danos indiretos, incidentais ou consequenciais
            resultantes do uso ou incapacidade de usar o serviço.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            7. Modificações dos Termos
          </Heading>
          <Text>
            Reservamos o direito de modificar estes termos a qualquer momento. As alterações
            entrarão em vigor imediatamente após a publicação.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            8. Lei Aplicável
          </Heading>
          <Text>
            Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida nos
            tribunais competentes.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            9. Contato
          </Heading>
          <Text>
            Para questões sobre estes termos, entre em contato conosco através do e-mail:
            legal@hotel.com
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default TermsOfService;

