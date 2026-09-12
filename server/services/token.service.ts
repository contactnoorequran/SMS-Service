import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AuthTokenPayload, UserRole, UserStatus, SafeUser } from '../types/auth';
import { Logger } from '../utils/logger';
import { UserRepository } from './user.repository';

const tokenLogger = new Logger('TokenService');

// In-memory revoked token ID store (in production can back to Redis/Database)
const revokedTokenIds = new Set<string>();

export interface TokenVerificationResult {
  valid: boolean;
  expired: boolean;
  revoked: boolean;
  payload: AuthTokenPayload | null;
  error?: string;
}

export class TokenService {
  /**
   * Generates a signed JWT with a unique token ID for revocation tracking.
   */
  static generateToken(user: { id: string; email: string; role: UserRole; status: UserStatus }): {
    token: string;
    expiresIn: string;
    tokenId: string;
  } {
    const tokenId = crypto.randomUUID();
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tokenId,
    };

    let expiresInClean = (env.JWT_EXPIRES_IN || '7d').replace(/['"]/g, '').trim();
    // Guard against unintended 1-second or tiny expiry
    if (/^\d+$/.test(expiresInClean) && parseInt(expiresInClean, 10) < 3600) {
      expiresInClean = '7d';
    } else if (expiresInClean === '1s' || expiresInClean === '1' || expiresInClean === '0') {
      expiresInClean = '7d';
    }

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: expiresInClean as any,
    });

    return {
      token,
      expiresIn: expiresInClean,
      tokenId,
    };
  }

  /**
   * Detailed verification of JWT token distinguishing expired, revoked, and malformed tokens.
   */
  static verifyTokenDetailed(token: string): TokenVerificationResult {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

      // Check if this token ID has been revoked (e.g. via logout)
      if (decoded.tokenId && revokedTokenIds.has(decoded.tokenId)) {
        tokenLogger.warn(`Rejected revoked token: ${decoded.tokenId}`);
        return {
          valid: false,
          expired: false,
          revoked: true,
          payload: null,
          error: 'Token has been revoked',
        };
      }

      return {
        valid: true,
        expired: false,
        revoked: false,
        payload: decoded,
      };
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        // Normal lifecycle event: log at debug level so it does not trigger error alert monitors
        tokenLogger.debug(`Token expired: ${error?.message}`);
        return {
          valid: false,
          expired: true,
          revoked: false,
          payload: null,
          error: 'Token has expired',
        };
      }
      tokenLogger.warn(`Failed to verify token: ${error?.message}`);
      return {
        valid: false,
        expired: false,
        revoked: false,
        payload: null,
        error: error?.message || 'Invalid token',
      };
    }
  }

  /**
   * Verifies and decodes a JWT. Returns null if invalid, expired, or revoked.
   */
  static verifyToken(token: string): AuthTokenPayload | null {
    const result = this.verifyTokenDetailed(token);
    return result.valid ? result.payload : null;
  }

  /**
   * Refreshes a valid or recently expired JWT token without requiring password re-entry.
   * Allows up to 7-day grace period for seamlessly renewing active sessions.
   */
  static async refreshToken(oldToken: string): Promise<{
    token: string;
    expiresIn: string;
    tokenId: string;
    user: SafeUser;
  } | null> {
    try {
      const decoded = jwt.verify(oldToken, env.JWT_SECRET, { ignoreExpiration: true }) as AuthTokenPayload;
      if (!decoded || !decoded.userId) {
        return null;
      }

      if (decoded.tokenId && revokedTokenIds.has(decoded.tokenId)) {
        return null;
      }

      // Check if token is beyond the 7-day grace window
      const nowSeconds = Math.floor(Date.now() / 1000);
      const exp = (decoded as any).exp;
      if (exp && nowSeconds - exp > 7 * 86400) {
        tokenLogger.debug(`Refresh rejected: token expired beyond 7-day grace window`);
        return null;
      }

      // Verify user account exists and is ACTIVE
      const user = await UserRepository.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        return null;
      }

      // Invalidate the old token ID
      if (decoded.tokenId) {
        this.revokeToken(decoded.tokenId);
      }

      // Generate a fresh token
      const newTokenData = this.generateToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        status: user.status,
      });

      // Update login timestamp
      await UserRepository.updateLastLogin(user.id);

      return {
        ...newTokenData,
        user,
      };
    } catch (err: any) {
      tokenLogger.debug(`Token refresh failed: ${err?.message}`);
      return null;
    }
  }

  /**
   * Revokes a token by adding its unique token ID to the blacklist.
   */
  static revokeToken(tokenId: string): void {
    if (tokenId) {
      revokedTokenIds.add(tokenId);
      tokenLogger.info(`Token revoked: ${tokenId}`);
    }
  }

  /**
   * Checks if a token ID has been revoked.
   */
  static isRevoked(tokenId: string): boolean {
    return revokedTokenIds.has(tokenId);
  }
}
