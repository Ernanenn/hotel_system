# 🚀 Guia para Subir o Projeto no GitHub

## Passo 1: Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name**: `hotel-management-system` (ou o nome que preferir)
   - **Description**: "Sistema completo de gestão de hotel com NestJS e React"
   - **Visibility**: Escolha Public ou Private
   - **NÃO marque** "Initialize this repository with a README" (já temos um)
5. Clique em **"Create repository"**

## Passo 2: Conectar Repositório Local ao GitHub

Após criar o repositório, o GitHub mostrará instruções. Execute os seguintes comandos no terminal:

```bash
# Adicionar o remote (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/hotel-management-system.git

# Verificar se foi adicionado corretamente
git remote -v

# Fazer push do código
git branch -M main
git push -u origin main
```

## Passo 3: Verificar Push

Após o push, acesse seu repositório no GitHub e verifique se todos os arquivos foram enviados corretamente.

## 📝 Comandos Úteis para o Futuro

### Adicionar mudanças
```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

### Criar uma nova branch
```bash
git checkout -b nome-da-branch
git push -u origin nome-da-branch
```

### Verificar status
```bash
git status
git log --oneline
```

## 🔐 Configurações Adicionais (Opcional)

### Adicionar .env.example
Crie um arquivo `.env.example` com as variáveis de ambiente necessárias (sem valores sensíveis) para que outros desenvolvedores saibam quais variáveis configurar.

### Configurar GitHub Actions
O projeto já possui um workflow de CI/CD em `backend/.github/workflows/ci.yml` que será executado automaticamente em cada push.

### Adicionar Badges ao README
Você pode adicionar badges de status do CI/CD, cobertura de testes, etc. ao README.md.

## ⚠️ Importante

- **NUNCA** faça commit do arquivo `.env` com credenciais reais
- O `.gitignore` já está configurado para ignorar arquivos sensíveis
- Mantenha o README.md atualizado com as mudanças do projeto

