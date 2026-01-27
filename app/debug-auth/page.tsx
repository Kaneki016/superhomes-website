'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
    const { user, profile, session } = useAuth()
    const [buyers, setBuyers] = useState<any[]>([])
    const [contacts, setContacts] = useState<any[]>([])
    const [errors, setErrors] = useState<any>({})

    useEffect(() => {
        async function checkData() {
            if (!user) return

            // 1. Check Buyers
            const { data: bData, error: bError } = await supabase
                .from('buyers')
                .select('*')
                .eq('auth_id', user.id)
            setBuyers(bData || [])
            if (bError) setErrors((prev: any) => ({ ...prev, buyers: bError }))

            // 2. Check Contacts (Agents)
            const { data: cData, error: cError } = await supabase
                .from('contacts')
                .select('*')
                .eq('auth_id', user.id)
            setContacts(cData || [])
            if (cError) setErrors((prev: any) => ({ ...prev, contacts: cError }))
        }

        checkData()
    }, [user])

    return (
        <div className="container mx-auto p-10 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">Debug Auth & Profile</h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold border-b mb-2">Auth User</h2>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>

                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-bold border-b mb-2">Current Context Profile</h2>
                    <pre>{JSON.stringify(profile, null, 2)}</pre>
                </div>

                <div className="border p-4 rounded bg-yellow-50">
                    <h2 className="font-bold border-b mb-2">Buyers Table Query (auth_id)</h2>
                    <p>Rows found: {buyers.length}</p>
                    {errors.buyers && <p className="text-red-600">{JSON.stringify(errors.buyers)}</p>}
                    <pre>{JSON.stringify(buyers, null, 2)}</pre>
                </div>

                <div className="border p-4 rounded bg-green-50">
                    <h2 className="font-bold border-b mb-2">Contacts Table Query (auth_id)</h2>
                    <p>Rows found: {contacts.length}</p>
                    {errors.contacts && <p className="text-red-600">{JSON.stringify(errors.contacts)}</p>}
                    <pre>{JSON.stringify(contacts, null, 2)}</pre>
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border rounded">
                <h3 className="font-bold text-lg">Diagnosis Guide</h3>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                        <strong>If Contacts has 0 rows:</strong> misuse of INSERT policy or insert failed silently.
                        The agent account was never created.
                    </li>
                    <li>
                        <strong>If Contacts has rows but Context Profile is Buyer:</strong> The `fetchProfile` priority fix wasn&apos;t applied or `fetchProfile` is erroring out.
                    </li>
                    <li>
                        <strong>If Contacts shows `[]` (empty) but you swore you inserted it:</strong> SELECT Policy is missing (RLS is hiding it).
                    </li>
                </ul>
            </div>
        </div>
    )
}
