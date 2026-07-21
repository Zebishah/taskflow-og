import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, gt, isNull } from 'drizzle-orm';

import type {
  CreatedSession,
  RefreshTokenData,
  RequestMetadata,
} from './auth.types';
import { DATABASE } from 'src/database/database.constants';
import { type Database } from 'src/database/database.types';
import { authSessions } from 'src/database/schema';

@Injectable()
export class SessionService {
  private readonly refreshTokenTtlDays: number;

  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenTtlDays = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_TTL_DAYS',
    );
  }

  public async createSession(
    userId: string,
    metadata: RequestMetadata,
  ): Promise<CreatedSession> {
    const sessionId = randomUUID();
    const secret = randomBytes(48).toString('base64url');

    const refreshToken = `${sessionId}.${secret}`;
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const expiresAt = this.calculateExpirationDate();

    await this.database.insert(authSessions).values({
      id: sessionId,
      userId,
      refreshTokenHash,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt,
    });

    return {
      refreshToken,
      expiresAt,
    };
  }

  public async rotateSession(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<{
    userId: string;
    session: CreatedSession;
  } | null> {
    const parsedToken = this.parseRefreshToken(refreshToken);

    if (!parsedToken) {
      return null;
    }

    const [session] = await this.database
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.id, parsedToken.sessionId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      return null;
    }

    const providedHash = this.hashRefreshToken(refreshToken);

    if (!this.safeCompare(providedHash, session.refreshTokenHash)) {
      return null;
    }

    const rotatedToken = randomBytes(48).toString('base64url');

    const newRefreshToken = `${session.id}.${rotatedToken}`;

    const newRefreshTokenHash = this.hashRefreshToken(newRefreshToken);

    const newExpiresAt = this.calculateExpirationDate();

    const [updatedSession] = await this.database
      .update(authSessions)
      .set({
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(authSessions.id, session.id),
          eq(authSessions.refreshTokenHash, session.refreshTokenHash),
          isNull(authSessions.revokedAt),
        ),
      )
      .returning({
        id: authSessions.id,
      });

    if (!updatedSession) {
      return null;
    }

    return {
      userId: session.userId,
      session: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    };
  }

  public async revokeSession(refreshToken: string): Promise<void> {
    const parsedToken = this.parseRefreshToken(refreshToken);

    if (!parsedToken) {
      return;
    }

    await this.database
      .update(authSessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(authSessions.id, parsedToken.sessionId),
          isNull(authSessions.revokedAt),
        ),
      );
  }

  private parseRefreshToken(refreshToken: string): RefreshTokenData | null {
    const separatorIndex = refreshToken.indexOf('.');

    if (separatorIndex <= 0) {
      return null;
    }

    const sessionId = refreshToken.slice(0, separatorIndex);

    const secret = refreshToken.slice(separatorIndex + 1);

    if (!sessionId || !secret) {
      return null;
    }

    return {
      sessionId,
      secret,
    };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private safeCompare(firstValue: string, secondValue: string): boolean {
    const firstBuffer = Buffer.from(firstValue);
    const secondBuffer = Buffer.from(secondValue);

    if (firstBuffer.length !== secondBuffer.length) {
      return false;
    }

    return timingSafeEqual(firstBuffer, secondBuffer);
  }

  private calculateExpirationDate(): Date {
    const expirationDate = new Date();

    expirationDate.setDate(expirationDate.getDate() + this.refreshTokenTtlDays);

    return expirationDate;
  }
}
