import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Image,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import api from '../services/api';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  roomId?: string;
  multiple?: boolean;
  maxSize?: number; // em MB
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  roomId,
  multiple = false,
  maxSize = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let uploadUrl = '/upload/rooms';
      if (roomId) {
        uploadUrl = `/rooms/${roomId}/image`;
      }

      const response = await api.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.url || response.data.room?.imageUrl || response.data.imageUrl;
      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    try {
      if (roomId) {
        await api.delete(`/rooms/${roomId}/image`);
      } else {
        // Para uploads genéricos, usar o endpoint de upload
        const encodedUrl = encodeURIComponent(value);
        await api.delete(`/upload/${encodedUrl}`);
      }

      setPreview(null);
      onChange(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao deletar imagem');
      // Mesmo com erro, limpar o preview localmente
      setPreview(null);
      onChange(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <VStack spacing={4} align="stretch">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {preview ? (
        <Box position="relative">
          <Image
            src={preview}
            alt="Preview"
            maxH="300px"
            objectFit="cover"
            borderRadius="md"
            w="100%"
          />
          <IconButton
            aria-label="Deletar imagem"
            icon={<DeleteIcon />}
            colorScheme="red"
            size="sm"
            position="absolute"
            top={2}
            right={2}
            onClick={handleDelete}
            isDisabled={uploading}
          />
        </Box>
      ) : (
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="md"
          p={8}
          textAlign="center"
          cursor="pointer"
          onClick={handleClick}
          _hover={{ borderColor: 'brand.500', bg: 'gray.50' }}
        >
          <VStack spacing={2}>
            <AddIcon boxSize={8} color="gray.400" />
            <Text color="gray.600">
              Clique para fazer upload de uma imagem
            </Text>
            <Text fontSize="sm" color="gray.500">
              JPG, PNG, WEBP ou GIF (máx. {maxSize}MB)
            </Text>
          </VStack>
        </Box>
      )}

      {!preview && (
        <Button
          leftIcon={<AddIcon />}
          onClick={handleClick}
          isLoading={uploading}
          loadingText="Enviando..."
          colorScheme="brand"
        >
          Selecionar Imagem
        </Button>
      )}

      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
    </VStack>
  );
};

export default ImageUpload;

