import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let refreshTokenRepository: Repository<RefreshToken>;

  const mockUsersService = {
    validateUser: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '1h';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return null;
    }),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
      };
      mockUsersService.validateUser.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockUsersService.validateUser.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
      };
      mockJwtService.sign.mockReturnValue('mock-token');
      mockRefreshTokenRepository.create.mockReturnValue({
        token: 'refresh-token',
        userId: '1',
      });
      mockRefreshTokenRepository.save.mockResolvedValue({
        id: '1',
        token: 'refresh-token',
        userId: '1',
      });

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const mockUser = {
        id: '2',
        ...registerDto,
        role: 'client',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');
      mockRefreshTokenRepository.create.mockReturnValue({
        token: 'refresh-token',
        userId: '2',
      });
      mockRefreshTokenRepository.save.mockResolvedValue({
        id: '2',
        token: 'refresh-token',
        userId: '2',
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'existing@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access token if refresh token is valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
      };

      const mockRefreshToken = {
        id: '1',
        token: 'valid-refresh-token',
        userId: '1',
        user: mockUser,
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('new-access-token');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token', async () => {
      const mockRefreshToken = {
        id: '1',
        token: 'valid-refresh-token',
        userId: 'user1',
        isRevoked: false,
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      mockRefreshTokenRepository.save.mockResolvedValue({
        ...mockRefreshToken,
        isRevoked: true,
      });

      await service.revokeRefreshToken('valid-refresh-token');

      expect(mockRefreshTokenRepository.save).toHaveBeenCalled();
    });
  });
});
