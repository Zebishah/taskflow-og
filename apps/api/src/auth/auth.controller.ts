import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import type { AccessTokenPayload, RequestMetadata } from './auth.types';
import { REFRESH_TOKEN_COOKIE_NAME } from './auth.constants';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  public constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';
  }

  @Post('register')
  public async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string,
  ) {
    const authentication = await this.authService.register(
      dto,
      this.getRequestMetadata(request, ipAddress),
    );

    this.setRefreshTokenCookie(
      response,
      authentication.refreshToken,
      authentication.refreshTokenExpiresAt,
    );

    return authentication.result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  public async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string,
  ) {
    const authentication = await this.authService.login(
      dto,
      this.getRequestMetadata(request, ipAddress),
    );

    this.setRefreshTokenCookie(
      response,
      authentication.refreshToken,
      authentication.refreshTokenExpiresAt,
    );

    return authentication.result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  public async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string,
  ) {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Authentication session is missing');
    }

    const authentication = await this.authService.refresh(
      refreshToken,
      this.getRequestMetadata(request, ipAddress),
    );

    this.setRefreshTokenCookie(
      response,
      authentication.refreshToken,
      authentication.refreshTokenExpiresAt,
    );

    return authentication.result;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  public async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

    await this.authService.logout(refreshToken);

    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.getCookieBaseOptions(),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  public async getCurrentUser(
    @CurrentUser()
    currentUser: AccessTokenPayload,
  ) {
    return this.authService.getCurrentUser(currentUser.sub);
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    expiresAt: Date,
  ): void {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...this.getCookieBaseOptions(),
      expires: expiresAt,
    });
  }

  private getCookieBaseOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
    };
  }

  private getRequestMetadata(
    request: Request,
    ipAddress: string,
  ): RequestMetadata {
    return {
      userAgent: request.get('user-agent') ?? null,
      ipAddress: ipAddress || null,
    };
  }
}
