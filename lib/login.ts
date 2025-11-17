'use server'

import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types'
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import User from '@/models/user'
import {
  getCredentialForResponse,
  getCredentialsOfUser,
  getUserFromEmail,
  updateCredentialSignCount,
} from '@lib/database'
import { setChallengeToCookieStorage, clearCookies } from '@lib/cookieActions'
import { connectToMongoDB } from '@lib/db'

const rpID = process.env.WEBAUTHN_RP_ID ?? 'localhost'
const expectedOrigin = process.env.WEBAUTHN_ORIGIN ?? `http://${rpID}:3000`

export const getAuthenticationOptionsJSON = async (
  email: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> => {
  const user = await getUserFromEmail(email)
  const credentials = await getCredentialsOfUser(user._id.toString())
  const allowCredentials = credentials.map((credential) => ({
    id: credential.credentialId,
    type: 'public-key' as const,
  }))

  const authenticationOptionsParameters = {
    timeout: 60000,
    allowCredentials,
    userVerification: 'required' as const,
    rpID,
  }

  const authenticationOptionsJSON = await generateAuthenticationOptions(
    authenticationOptionsParameters,
  )
  await setChallengeToCookieStorage(authenticationOptionsJSON.challenge)
  return authenticationOptionsJSON
}

export const loginUser = async (
  challenge: string,
  email: string,
  authenticationResponse: AuthenticationResponseJSON,
) => {
  if (!authenticationResponse?.id) {
    throw new Error('Invalid Credentials')
  }

  await connectToMongoDB()
  const user = await User.findOne({ email })
  if (!user) {
    throw new Error('Unknown User')
  }

  const userCredential = await getCredentialForResponse(authenticationResponse.id)

  if (!userCredential) {
    throw new Error('Authenticator is not registered with this site')
  }

  const publicKeyBuffer = Buffer.from(userCredential.publicKey, 'base64')

  const verification = await verifyAuthenticationResponse({
    response: authenticationResponse,
    expectedChallenge: challenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: userCredential.credentialId,
      publicKey: publicKeyBuffer,
      counter: userCredential.counter,
    },
  })

  if (!verification.verified) {
    throw new Error('Login verification failed')
  }

  await updateCredentialSignCount(
    userCredential.credentialId,
    verification.authenticationInfo?.newCounter ?? userCredential.counter,
  )
  await clearCookies()

  return user
}

