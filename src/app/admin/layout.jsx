import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
    const pathname = (await headers()).get('x-admin-pathname');

    if (pathname !== '/admin/login') {
        const auth = await requireAdmin();
        if (!auth.ok) {
            const callbackUrl = pathname || '/admin/dashboard';
            redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
    }

    return children;
}
