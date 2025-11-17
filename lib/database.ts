'use server'

import type { VerifiedRegistrationResponse } from '@simplewebauthn/server'
import { connectToMongoDB } from '@lib/db'
import User from '@/models/user'
import WebAuthnCredential, {
  type IWebAuthnCredential,
} from '@/models/webauthnCredential'
type RegistrationInfoExtended = NonNullable<
  VerifiedRegistrationResponse['registrationInfo']
> & {
  credential?: NonNullable<VerifiedRegistrationResponse['registrationInfo']>['credential']
}

export const registerUser = async (
  email: string,
  username: string,
  verification: VerifiedRegistrationResponse,
) => {
  await connectToMongoDB()

  const registrationInfo = verification.registrationInfo as RegistrationInfoExtended | undefined

  const {
    credential: verifiedCredential,
    credentialDeviceType,
    credentialBackedUp,
    aaguid,
  } = registrationInfo ?? {}

  if (!verifiedCredential?.id || !verifiedCredential?.publicKey) {
    throw new Error('Registration failed')
  }

  const { id: credentialIdBase64, publicKey: credentialPublicKey, counter = 0 } = verifiedCredential

  const user =
    (await User.findOne({ email })) ??
    (await User.create({
      email,
      name: username,
    }))

  const existingCredential = await WebAuthnCredential.findOne({
    credentialId: credentialIdBase64,
  })

  if (existingCredential) {
    throw new Error('Credential already registered')
  }

  const storedCredential = await WebAuthnCredential.create({
    userId: user._id,
    credentialId: credentialIdBase64,
    publicKey: Buffer.from(credentialPublicKey).toString('base64'),
    counter,
    deviceType: credentialDeviceType ?? 'singleDevice',
    backedUp: credentialBackedUp ?? false,
    aaguid,
  })

  if (!user.name && username) {
    user.name = username
  }

  if (!Array.isArray(user.credentials)) {
    user.credentials = []
  }
  const credentialRef = storedCredential._id
  const hasCredential = (user.credentials as unknown[]).some((storedId: unknown) => {
    const storedIdString =
      typeof storedId === 'string'
        ? storedId
        : typeof (storedId as { toString?: () => string })?.toString === 'function'
          ? (storedId as { toString: () => string }).toString()
          : undefined
    return storedIdString === credentialRef.toString()
  })
  if (!hasCredential) {
    user.credentials.push(credentialRef as typeof user.credentials[number])
  }

  await user.save()

  return user
}

export const getUserFromEmail = async (email: string) => {
  await connectToMongoDB()
  const user = await User.findOne({ email })
  if (!user) {
    throw new Error('User with this email does not exist')
  }
  return user
}

type WebAuthnCredentialLean = Pick<
  IWebAuthnCredential,
  'credentialId' | 'publicKey' | 'counter' | 'userId'
>

export const getCredentialsOfUser = async (
  userId: string,
): Promise<WebAuthnCredentialLean[]> => {
  await connectToMongoDB()
  const credentials = (await WebAuthnCredential.find({
    userId,
  }).lean()) as WebAuthnCredentialLean[]

  if (!credentials.length) {
    throw new Error('No credentials found for the user')
  }

  return credentials
}

export const updateCredentialSignCount = async (
  credentialId: string,
  newSignCount: number,
) => {
  await connectToMongoDB()
  await WebAuthnCredential.findOneAndUpdate(
    { credentialId },
    {
      counter: newSignCount,
    },
  )
}

export const getCredentialForResponse = async (
  credentialId: string,
): Promise<WebAuthnCredentialLean | null> => {
  await connectToMongoDB()
  return WebAuthnCredential.findOne({
    credentialId,
  }).lean<WebAuthnCredentialLean>()
}

