import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        try {
            // Exchange the code for a session - this will set cookies automatically
            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('Code exchange error:', error)
                return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
            }
        } catch (err) {
            console.error('Auth callback error:', err)
            return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
        }
    }

    // Redirect to home page after successful auth
    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
