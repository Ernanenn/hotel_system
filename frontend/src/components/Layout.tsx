import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import InstallPWAButton from './InstallPWAButton';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
        <Flex
          maxW="1200px"
          mx="auto"
          px={4}
          py={4}
          justify="space-between"
          align="center"
        >
          <Link to="/">
            <Heading size="md" color="brand.600">
              Hotel Management
            </Heading>
          </Link>

          {isMobile ? (
            <>
              <IconButton
                aria-label="Menu"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                variant="ghost"
              />
              <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent>
                  <DrawerCloseButton />
                  <DrawerHeader>Menu</DrawerHeader>
                  <DrawerBody>
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <InstallPWAButton />
                      </Box>
                      <Link to="/rooms" onClick={onClose}>
                        <Button variant="ghost" w="100%" justifyContent="flex-start">
                          Quartos
                        </Button>
                      </Link>
                      {user ? (
                        <>
                          {user.role === 'admin' && (
                            <>
                              <Link to="/admin" onClick={onClose}>
                                <Button variant="ghost" w="100%" justifyContent="flex-start">
                                  Dashboard
                                </Button>
                              </Link>
                              <Link to="/admin/reports" onClick={onClose}>
                                <Button variant="ghost" w="100%" justifyContent="flex-start">
                                  Relatórios
                                </Button>
                              </Link>
                              <Link to="/admin/coupons" onClick={onClose}>
                                <Button variant="ghost" w="100%" justifyContent="flex-start">
                                  Cupons
                                </Button>
                              </Link>
                              <Link to="/admin/hotels" onClick={onClose}>
                                <Button variant="ghost" w="100%" justifyContent="flex-start">
                                  Hotéis
                                </Button>
                              </Link>
                              <Link to="/admin/calendar" onClick={onClose}>
                                <Button variant="ghost" w="100%" justifyContent="flex-start">
                                  Calendário
                                </Button>
                              </Link>
                              <Link to="/admin/room-blocks" onClick={onClose}>
                                <Button variant="ghost" w="100%" justifyContent="flex-start">
                                  Bloqueios
                                </Button>
                              </Link>
                            </>
                          )}
                          <Link to="/my-reservations" onClick={onClose}>
                            <Button variant="ghost" w="100%" justifyContent="flex-start">
                              Minhas Reservas
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            w="100%"
                            justifyContent="flex-start"
                            onClick={() => {
                              navigate('/profile');
                              onClose();
                            }}
                          >
                            Meu Perfil
                          </Button>
                          <Button
                            variant="ghost"
                            w="100%"
                            justifyContent="flex-start"
                            onClick={handleLogout}
                          >
                            Sair
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" onClick={onClose}>
                            <Button variant="ghost" w="100%" justifyContent="flex-start">
                              Entrar
                            </Button>
                          </Link>
                          <Link to="/register" onClick={onClose}>
                            <Button colorScheme="brand" w="100%">
                              Cadastrar
                            </Button>
                          </Link>
                        </>
                      )}
                    </VStack>
                  </DrawerBody>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <Flex align="center" gap={4}>
              <InstallPWAButton />
              <Link to="/rooms">
                <Button variant="ghost">Quartos</Button>
              </Link>

              {user ? (
                <>
                  {user.role === 'admin' && (
                  <>
                    <Link to="/admin">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                    <Link to="/admin/reports">
                      <Button variant="ghost">Relatórios</Button>
                    </Link>
                    <Link to="/admin/coupons">
                      <Button variant="ghost">Cupons</Button>
                    </Link>
                    <Link to="/admin/hotels">
                      <Button variant="ghost">Hotéis</Button>
                    </Link>
                    <Link to="/admin/calendar">
                      <Button variant="ghost">Calendário</Button>
                    </Link>
                    <Link to="/admin/room-blocks">
                      <Button variant="ghost">Bloqueios</Button>
                    </Link>
                  </>
                )}
                  <Link to="/my-reservations">
                    <Button variant="ghost">Minhas Reservas</Button>
                  </Link>
                  <Menu>
                    <MenuButton>
                      <Flex align="center" gap={2}>
                        <Avatar size="sm" name={`${user.firstName} ${user.lastName}`} />
                        <Text>{user.firstName}</Text>
                      </Flex>
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => navigate('/profile')}>
                        Meu Perfil
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>Sair</MenuItem>
                    </MenuList>
                  </Menu>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Entrar</Button>
                  </Link>
                  <Link to="/register">
                    <Button colorScheme="brand">Cadastrar</Button>
                  </Link>
                </>
              )}
            </Flex>
          )}
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={4} py={8}>
        <Outlet />
      </Box>

      <Box
        as="footer"
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        mt={8}
        py={4}
      >
        <Box maxW="1200px" mx="auto" px={4}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Text fontSize="sm" color="gray.600">
              © {new Date().getFullYear()} Hotel Management. Todos os direitos reservados.
            </Text>
            <HStack spacing={4}>
              <Link to="/privacy">
                <Button variant="link" size="sm" color="gray.600">
                  Política de Privacidade
                </Button>
              </Link>
              <Link to="/terms">
                <Button variant="link" size="sm" color="gray.600">
                  Termos de Uso
                </Button>
              </Link>
            </HStack>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;

