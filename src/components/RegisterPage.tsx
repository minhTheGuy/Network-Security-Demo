'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supported } from '@github/webauthn-json'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startRegistration } from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types'

const RegisterPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setIsAvailable(available && supported())
      } catch {
        setIsAvailable(false)
      }
    }

    checkAvailability()
  }, [])

  const requestChallenge = async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    const response = await fetch('/api/auth/register-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username }),
    })
    if (!response.ok) {
      throw new Error((await response.json()).error ?? 'Không tạo được challenge đăng ký')
    }
    const data = await response.json()
    return data.options as PublicKeyCredentialCreationOptionsJSON
  }

  const verifyResponse = async (registrationResponse: RegistrationResponseJSON) => {
    const response = await fetch('/api/auth/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, credential: registrationResponse }),
    })
    if (!response.ok) {
      throw new Error((await response.json()).error ?? 'Xác minh đăng ký thất bại')
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const options = await requestChallenge()
      const registrationResponse = await startRegistration(options)
      await verifyResponse(registrationResponse)
      router.push('/admin')
    } catch (err) {
      const registerError = err instanceof Error ? err : new Error('Đăng ký thất bại')
      setError(registerError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAvailable === null) {
    return <p>Đang kiểm tra khả năng WebAuthn...</p>
  }

  if (isAvailable === false) {
    return <p>Thiết bị của bạn không hỗ trợ WebAuthn.</p>
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm w-full">
      <form method="POST" onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Tên hiển thị"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-black"
        />
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-black"
          required
        />
        <button
          type="submit"
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
          disabled={isSubmitting || email.length === 0}
        >
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký Passkey'}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>

      <div className="mt-4">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">hoặc</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>
      </div>

      <Link href="/faceid/register">
        <button
          type="button"
          className="w-full p-2 border-2 border-blue-500 text-blue-500 rounded px-4 py-2 font-bold hover:bg-blue-500 hover:text-white transition-colors">
          Đăng ký bằng FaceID/TouchID
        </button>
      </Link>
    </div>
  )
}

export default RegisterPage

