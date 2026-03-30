'use client'

import { useActionState } from 'react'
import { login, signup } from '@/app/login/actions'
import { StyledButton } from './StyledButtons'

async function loginAction(prevState: any, formData: FormData) {
    return await login(formData)
}

async function signupAction(prevState: any, formData: FormData) {
    return await signup(formData)
}

export default function LoginForm() {
    const [loginState, loginDispatch, isLoginPending] = useActionState(loginAction, null)
    const [signupState, signupDispatch, isSignupPending] = useActionState(signupAction, null)

    return (
        <div className="bg-white p-8 sm:p-10 rounded-xl border border-gray-200 w-full max-w-md shadow-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-extrabold tracking-tighter mb-2">
                    LIVE<span className="text-gray-400">.APP</span>
                </h1>
                <p className="text-sm text-gray-500">
                    Acceso para Modelos y Administradores
                </p>
            </div>

            <form className="flex flex-col gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-base outline-none text-gray-900 transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black/5"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-base outline-none text-gray-900 transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black/5"
                    />
                </div>

                {loginState?.error && (
                    <div className="text-red-500 text-sm text-center font-medium">
                        {loginState.error}
                    </div>
                )}
                {signupState?.error && (
                    <div className="text-red-500 text-sm text-center font-medium">
                        {signupState.error}
                    </div>
                )}

                <div className="flex gap-4 pt-2">
                    <StyledButton formAction={loginDispatch} variant="primary" fullWidth disabled={isLoginPending || isSignupPending}>
                        {isLoginPending ? 'Entrando...' : 'Iniciar Sesión'}
                    </StyledButton>
                    <StyledButton formAction={signupDispatch} variant="secondary" fullWidth disabled={isLoginPending || isSignupPending}>
                        {isSignupPending ? 'Registrando...' : 'Registrarse'}
                    </StyledButton>
                </div>
            </form>
        </div>
    )
}
