import { verifyToken as verifyJWT } from '../lib/auth';

/**
 * Authenticates a request by extracting and verifying the Bearer token from Authorization header
 * @param authorization The Authorization header value
 * @returns The decoded user object if valid, null if invalid
 */
export async function authenticateRequest(authorization: string | undefined): Promise<any> {
  if (!authorization) {
    return null;
  }

  const token = authorization.replace('Bearer ', '');
  return verifyJWT(token);
}
