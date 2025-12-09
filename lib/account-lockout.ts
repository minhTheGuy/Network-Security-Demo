/**
 * Account lockout management
 * Tracks failed login/registration attempts and locks accounts
 */

'use server'

import { connectToMongoDB } from '@lib/db'
import mongoose from 'mongoose'

interface IAccountLockout extends mongoose.Document {
  identifier: string // email or IP address
  type: 'email' | 'ip'
  failedAttempts: number
  lockedUntil?: Date
  lastAttempt: Date
  createdAt: Date
  updatedAt: Date
}

const AccountLockoutSchema = new mongoose.Schema<IAccountLockout>(
  {
    identifier: { type: String, required: true, index: true },
    type: { type: String, enum: ['email', 'ip'], required: true, index: true },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, index: true },
    lastAttempt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Compound index for faster lookups
AccountLockoutSchema.index({ identifier: 1, type: 1 }, { unique: true })

const AccountLockout =
  mongoose.models.AccountLockout ||
  mongoose.model<IAccountLockout>('AccountLockout', AccountLockoutSchema)

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000

/**
 * Check if account/IP is locked
 */
export async function isLocked(identifier: string, type: 'email' | 'ip'): Promise<boolean> {
  await connectToMongoDB()

  const lockout = await AccountLockout.findOne({ identifier, type })

  if (!lockout || !lockout.lockedUntil) {
    return false
  }

  // Check if still locked
  if (lockout.lockedUntil > new Date()) {
    return true
  }

  // Lock expired, reset
  lockout.failedAttempts = 0
  lockout.lockedUntil = undefined
  await lockout.save()

  return false
}

/**
 * Record a failed attempt
 */
export async function recordFailedAttempt(
  identifier: string,
  type: 'email' | 'ip'
): Promise<{ locked: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  await connectToMongoDB()

  const lockout = await AccountLockout.findOneAndUpdate(
    { identifier, type },
    {
      $inc: { failedAttempts: 1 },
      $set: { lastAttempt: new Date() },
    },
    { upsert: true, new: true }
  )

  if (lockout.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // Lock the account
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
    lockout.lockedUntil = lockedUntil
    await lockout.save()

    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil,
    }
  }

  return {
    locked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - lockout.failedAttempts,
  }
}

/**
 * Clear failed attempts (on successful login/registration)
 */
export async function clearFailedAttempts(
  identifier: string,
  type: 'email' | 'ip'
): Promise<void> {
  await connectToMongoDB()

  await AccountLockout.findOneAndUpdate(
    { identifier, type },
    {
      $set: {
        failedAttempts: 0,
        lockedUntil: undefined,
      },
    }
  )
}

/**
 * Get lockout status
 */
export async function getLockoutStatus(
  identifier: string,
  type: 'email' | 'ip'
): Promise<{ locked: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  await connectToMongoDB()

  const lockout = await AccountLockout.findOne({ identifier, type })

  if (!lockout) {
    return {
      locked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    }
  }

  if (lockout.lockedUntil && lockout.lockedUntil > new Date()) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: lockout.lockedUntil,
    }
  }

  return {
    locked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - lockout.failedAttempts,
  }
}

