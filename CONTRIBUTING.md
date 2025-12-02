# Guia de Contribuição

Obrigado por considerar contribuir com o Sistema de Gestão de Hotel! Este documento fornece diretrizes para contribuições.

## 📋 Código de Conduta

### Nossos Valores

- **Respeito**: Trate todos com respeito e empatia
- **Inclusão**: Bem-vindos contribuidores de todos os níveis de experiência
- **Colaboração**: Trabalhe em conjunto para melhorar o projeto
- **Profissionalismo**: Mantenha um ambiente profissional e construtivo

### Comportamento Esperado

- Use linguagem acolhedora e inclusiva
- Respeite diferentes pontos de vista e experiências
- Aceite críticas construtivas com graça
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

### Comportamento Inaceitável

- Linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos
- Assédio público ou privado
- Publicar informações privadas de terceiros sem permissão
- Outras condutas inadequadas em um ambiente profissional

## 🚀 Como Contribuir

### Reportar Bugs

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/your-repo/issues)
2. Se não foi reportado, crie uma nova issue com:
   - Título claro e descritivo
   - Descrição detalhada do problema
   - Passos para reproduzir
   - Comportamento esperado vs. comportamento atual
   - Screenshots (se aplicável)
   - Ambiente (OS, versões, etc.)

### Sugerir Melhorias

1. Verifique se a sugestão já não existe
2. Crie uma issue com:
   - Descrição clara da funcionalidade
   - Justificativa (por que seria útil)
   - Exemplos de uso
   - Possíveis implementações

### Contribuir com Código

1. **Fork o repositório**
   ```bash
   git clone https://github.com/your-repo/hotel-management.git
   cd hotel-management
   ```

2. **Crie uma branch para sua feature**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

3. **Faça suas alterações**
   - Siga os padrões de código do projeto
   - Adicione testes quando apropriado
   - Atualize a documentação se necessário

4. **Commit suas mudanças**
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   ```

   **Convenção de Commits:**
   - `feat:` Nova funcionalidade
   - `fix:` Correção de bug
   - `docs:` Mudanças na documentação
   - `style:` Formatação, ponto e vírgula, etc.
   - `refactor:` Refatoração de código
   - `test:` Adição ou correção de testes
   - `chore:` Mudanças em build, dependências, etc.

5. **Push para sua branch**
   ```bash
   git push origin feature/nova-funcionalidade
   ```

6. **Abra um Pull Request**
   - Descreva claramente o que foi feito
   - Referencie issues relacionadas
   - Aguarde revisão

## 📝 Padrões de Código

### TypeScript/JavaScript

- Use TypeScript para tipagem forte
- Siga o ESLint configurado
- Use Prettier para formatação
- Nomes descritivos para variáveis e funções
- Comentários quando necessário

### Backend (NestJS)

- Use decorators do NestJS apropriadamente
- Siga a estrutura de módulos
- Valide inputs com DTOs
- Trate erros adequadamente
- Adicione documentação Swagger

### Frontend (React)

- Use componentes funcionais com hooks
- Mantenha componentes pequenos e focados
- Use TypeScript para props
- Siga os padrões do Chakra UI
- Gerencie estado adequadamente

### Testes

- Escreva testes para novas funcionalidades
- Mantenha cobertura acima de 80%
- Teste casos de sucesso e erro
- Use mocks quando apropriado

## 🔍 Processo de Revisão

1. **Revisão de Código**
   - Pelo menos um mantenedor revisará seu PR
   - Feedback será fornecido de forma construtiva
   - Faça as alterações solicitadas

2. **Testes**
   - Todos os testes devem passar
   - Novos testes devem ser adicionados quando apropriado

3. **Documentação**
   - Atualize README se necessário
   - Adicione comentários JSDoc/TSDoc
   - Atualize Swagger para novos endpoints

4. **Aprovação**
   - Após aprovação, o PR será mergeado
   - Mantenedores cuidarão do merge

## 📚 Recursos

- [Documentação NestJS](https://docs.nestjs.com/)
- [Documentação React](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chakra UI Docs](https://chakra-ui.com/)

## ❓ Dúvidas?

- Abra uma issue para discussão
- Entre em contato: support@hotel.com
- Participe das discussões nas issues

## 🙏 Agradecimentos

Obrigado por contribuir! Sua ajuda torna este projeto melhor para todos.

