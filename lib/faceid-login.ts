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
import { getRpID } from '@lib/webauthn-helpers'

export const getFaceIDAuthenticationOptionsJSON = async (
  email: string,
  rpID?: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> => {
  const finalRpID = rpID || process.env.WEBAUTHN_RP_ID || 'localhost'
  
  const user = await getUserFromEmail(email)
  if (!user) {
    throw new Error('Unknown User')
  }

  const credentials = await getCredentialsOfUser(user._id.toString())
  const allowCredentials = credentials.map((credential) => ({
    id: credential.credentialId,
    type: 'public-key' as const,
  }))

  const authenticationOptionsParameters = {
    timeout: 60000,
    allowCredentials,
    userVerification: 'required' as const,
    rpID: finalRpID,
  }

  const authenticationOptionsJSON = await generateAuthenticationOptions(
    authenticationOptionsParameters,
  )
  await setChallengeToCookieStorage(authenticationOptionsJSON.challenge, user._id.toString())
  
  return authenticationOptionsJSON
}

export const loginFaceIDUser = async (
  challenge: string,
  email: string,
  authenticationResponse: AuthenticationResponseJSON,
  rpID: string,
  expectedOrigin: string,
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
