import sql from '@/lib/db'

export default async function TestDbPage() {
    try {
        const [result] = await sql`SELECT 1 as val`
        return (
            <div className="p-10">
                <h1 className="text-2xl font-bold text-green-600">Database Connection Successful!</h1>
                <pre>{JSON.stringify(result, null, 2)}</pre>

                <h2 className="text-xl font-bold mt-8">Environment Variables check:</h2>
                <ul className="list-disc pl-5">
                    <li>DB_HOST: {process.env.DB_HOST ? 'Set' : 'Missing'}</li>
                    <li>DB_USER: {process.env.DB_USER ? 'Set' : 'Missing'}</li>
                    <li>DB_NAME: {process.env.DB_NAME ? 'Set' : 'Missing'}</li>
                    <li>TWILIO_ACCOUNT_SID: {process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing'}</li>
                    <li>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing'}</li>
                </ul>
            </div>
        )
    } catch (error: any) {
        return (
            <div className="p-10">
                <h1 className="text-2xl font-bold text-red-600">Database Connection Failed</h1>
                <p className="text-red-500 font-mono mt-4">{error.message}</p>
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </div>

                <h2 className="text-xl font-bold mt-8">Environment Variables check:</h2>
                <ul className="list-disc pl-5">
                    <li>DB_HOST: {process.env.DB_HOST ? 'Set' : 'Missing'}</li>
                    <li>DB_USER: {process.env.DB_USER ? 'Set' : 'Missing'}</li>
                    <li>DB_NAME: {process.env.DB_NAME ? 'Set' : 'Missing'}</li>
                </ul>
            </div>
        )
    }
}
