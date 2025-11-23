'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supported } from '@github/webauthn-json'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startAuthentication } from '@simplewebauthn/browser'
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types'

const LoginPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
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

  const requestChallenge = async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    const response = await fetch('/api/auth/login-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) {
      throw new Error((await response.json()).error ?? 'Không tạo được challenge')
    }
    const data = await response.json()
    return data.options as PublicKeyCredentialRequestOptionsJSON
  }

  const verifyResponse = async (authenticationResponse: AuthenticationResponseJSON) => {
    const response = await fetch('/api/auth/login-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, credential: authenticationResponse }),
    })
    if (!response.ok) {
      throw new Error((await response.json()).error ?? 'Đăng nhập thất bại')
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const options = await requestChallenge()
      const authenticationResponse = await startAuthentication({ optionsJSON: options })
      await verifyResponse(authenticationResponse)
      router.push('/admin')
    } catch (err) {
      const loginError = err instanceof Error ? err : new Error('Đăng nhập thất bại')
      setError(loginError.message)
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
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập bằng Passkey'}
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

      <Link href="/faceid/login">
        <button
          type="button"
          className="w-full p-2 border-2 border-blue-500 text-blue-500 rounded px-4 py-2 font-bold hover:bg-blue-500 hover:text-white transition-colors">
          Đăng nhập bằng FaceID/TouchID
        </button>
      </Link>
    </div>
  )
}

export default LoginPage

