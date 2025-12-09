'use server'

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types'
import type { VerifiedRegistrationResponse } from '@simplewebauthn/server'
import WebAuthnCredential from '@/models/webauthnCredential'
import { generateChallenge } from '@lib/auth'
import { connectToMongoDB } from '@lib/db'
import User from '@/models/user'
import { setChallengeToCookieStorage } from '@lib/cookieActions'
import { AuthenticatorTransport } from '@simplewebauthn/types'
import { getRpID, getOrigin } from '@lib/webauthn-helpers'

const rpName = process.env.WEBAUTHN_RP_NAME ?? 'MyApp WebAuthn'

export const getFaceIDRegistrationOptions = async (
  email: string,
  username: string,
  rpID?: string,
  expectedOrigin?: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> => {
  const finalRpID = rpID || process.env.WEBAUTHN_RP_ID || 'localhost'
  
  await connectToMongoDB()
  let user = await User.findOne({ email })
  if (!user) {
    user = await User.create({
      email,
      name: username,
    })
  } else if (!user.name && username) {
    user.name = username
    await user.save()
  }

  const existingCredentials = await WebAuthnCredential.find({
    userId: user._id,
  })

  const challenge = await generateChallenge()
  const excludeCredentials = existingCredentials.map((credential) => ({
    id: credential.credentialId,
    type: 'public-key' as const,
    transports: credential.transports as AuthenticatorTransport[] | undefined,
  }))

  const userIdBuffer = Buffer.from(user._id.toString())

  const authenticatorSelection = {
    authenticatorAttachment: 'platform' as const,
    residentKey: 'preferred' as const,
    userVerification: 'required' as const,
  }

  const registrationOptionsParameters = {
    challenge,
    rpName,
    rpID: finalRpID,
    userID: userIdBuffer,
    userName: email,
    userDisplayName: user.name || username || email,
    attestationType: 'none' as const,
    timeout: 60000,
    supportedAlgorithmIDs: [-7, -257],
    authenticatorSelection,
    excludeCredentials,
  }

  const registrationOptions = await generateRegistrationOptions(registrationOptionsParameters)
  await setChallengeToCookieStorage(registrationOptions.challenge, user._id.toString())
  
  return registrationOptions
}

export const verifyFaceIDRegistration = async (
  credential: RegistrationResponseJSON,
  challenge: string,
  rpID: string,
  expectedOrigin: string,
): Promise<VerifiedRegistrationResponse> => {
  if (!credential) {
    throw new Error('Invalid Credentials')
  }

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: challenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
  })

  if (!verification.verified) {
    throw new Error('Registration verification failed')
  }

  return verification
}
