import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { PublicUser } from '../users/users.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import type { AuthResult, RequestMetadata } from './auth.types';

@Injectable()
export class AuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  public async register(
    dto: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<{
    result: AuthResult;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  }> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    let createdUser;

    try {
      createdUser = await this.usersService.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }

    const session = await this.sessionService.createSession(
      createdUser.id,
      metadata,
    );

    const accessToken = await this.tokenService.createAccessToken({
      id: createdUser.id,
      email: createdUser.email,
    });

    return {
      result: {
        user: this.usersService.toPublicUser(createdUser),
        accessToken,
      },
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  public async login(
    dto: LoginDto,
    metadata: RequestMetadata,
  ): Promise<{
    result: AuthResult;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.passwordService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('This account is currently disabled');
    }

    const session = await this.sessionService.createSession(user.id, metadata);

    const accessToken = await this.tokenService.createAccessToken({
      id: user.id,
      email: user.email,
    });

    return {
      result: {
        user: this.usersService.toPublicUser(user),
        accessToken,
      },
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  public async refresh(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<{
    result: AuthResult;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  }> {
    const rotatedSession = await this.sessionService.rotateSession(
      refreshToken,
      metadata,
    );

    if (!rotatedSession) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.usersService.findById(rotatedSession.userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const accessToken = await this.tokenService.createAccessToken({
      id: user.id,
      email: user.email,
    });

    return {
      result: {
        user: this.usersService.toPublicUser(user),
        accessToken,
      },
      refreshToken: rotatedSession.session.refreshToken,
      refreshTokenExpiresAt: rotatedSession.session.expiresAt,
    };
  }

  public async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.sessionService.revokeSession(refreshToken);
  }

  public async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User account is unavailable');
    }

    return this.usersService.toPublicUser(user);
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
