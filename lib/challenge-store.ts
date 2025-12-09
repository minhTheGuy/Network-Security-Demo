/**
 * Challenge store to prevent replay attacks
 * Tracks used challenges to ensure one-time use
 */

'use server'

import { connectToMongoDB } from '@lib/db'
import mongoose from 'mongoose'

interface IChallenge extends mongoose.Document {
  challenge: string
  userId?: string
  used: boolean
  expiresAt: Date
  createdAt: Date
}

const ChallengeSchema = new mongoose.Schema<IChallenge>(
  {
    challenge: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    used: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
)

const Challenge = mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema)

export async function storeChallenge(challenge: string, userId?: string, ttlSeconds = 300) {
  await connectToMongoDB()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
  
  await Challenge.findOneAndUpdate(
    { challenge },
    {
      challenge,
      userId,
      used: false,
      expiresAt,
    },
    { upsert: true, new: true }
  )
}

export async function consumeChallenge(challenge: string): Promise<boolean> {
  await connectToMongoDB()
  
  const challengeDoc = await Challenge.findOne({ challenge })
  
  if (!challengeDoc) {
    return false // Challenge không tồn tại
  }
  
  if (challengeDoc.used) {
    return false // Challenge đã được sử dụng
  }
  
  if (challengeDoc.expiresAt < new Date()) {
    return false // Challenge đã hết hạn
  }
  
  // Đánh dấu challenge đã được sử dụng
  challengeDoc.used = true
  await challengeDoc.save()
  
  return true
}

// Cleanup old challenges (optional, MongoDB TTL index sẽ tự động xóa)
export async function cleanupExpiredChallenges() {
  await connectToMongoDB()
  await Challenge.deleteMany({ expiresAt: { $lt: new Date() } })
}

