import type { NextFunction, Request, Response } from 'express';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function bullBoardLocalOnly(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const remoteAddress = request.socket.remoteAddress;

  if (remoteAddress === undefined || !LOOPBACK_ADDRESSES.has(remoteAddress)) {
    response.status(403).json({
      statusCode: 403,
      message: 'Queue dashboard is available only from localhost',
      error: 'Forbidden',
    });

    return;
  }

  next();
}
