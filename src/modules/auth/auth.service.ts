import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabase';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/AppError';
import { RegisterInput, LoginInput } from './auth.schema';
import { AuthPayload } from '../../shared/types';

/**
 * User type from database
 */
interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  refresh_token_hash?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User type without sensitive data
 */
interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterInput): Promise<SafeUser> {
  const { email, password, firstName, lastName } = data;

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw AppError.conflict('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user into database
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'admin', // Default role for coffee shop employees
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating user:', insertError);
    throw AppError.internal('Failed to create user');
  }

  if (!newUser) {
    throw AppError.internal('Failed to create user');
  }

  return formatUser(newUser as User);
}

/**
 * Login user and generate tokens
 */
export async function login(
  email: string,
  password: string
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}> {
  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Generate access token
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Generate refresh token
  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Hash and save refresh token
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await supabase
    .from('users')
    .update({ refresh_token_hash: refreshTokenHash })
    .eq('id', user.id);

  return {
    user: formatUser(user as User),
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(token: string): Promise<{
  accessToken: string;
}> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Verify refresh token hash
    if (!user.refresh_token_hash) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(
      token,
      user.refresh_token_hash
    );

    if (!isTokenValid) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Logout user by clearing refresh token
 */
export async function logout(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ refresh_token_hash: null })
    .eq('id', userId);

  if (error) {
    console.error('Error logging out user:', error);
    throw AppError.internal('Failed to logout');
  }
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<SafeUser> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw AppError.notFound('User not found');
  }

  return formatUser(user as User);
}

/**
 * Generate access token
 */
function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * Format user object to remove sensitive data and convert to camelCase
 */
function formatUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
