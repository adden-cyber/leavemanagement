'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardCacheProvider } from '@/lib/DashboardCacheContext';
import AnalyticsView from '@/components/dashboard/AnalyticsView';
import EmployeesView from '@/components/dashboard/EmployeesView';
import LeaveView from '@/components/dashboard/LeaveView';
import LeaveHistoryView from '@/components/dashboard/LeaveHistoryView';
import ActivityView from '@/components/dashboard/ActivityView';
import SettingsView from '@/components/dashboard/SettingsView';
import ProfileSettingsView from '@/components/dashboard/ProfileSettingsView';
import LeaveCreditsView from '@/components/dashboard/LeaveCreditsView';
import LeaveManagementView from '@/components/dashboard/LeaveManagementView';

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();
    const view = searchParams.get('view') || 'analytics';
    const isAdmin = session?.user?.role === 'ADMIN';

    const leaveLabel = isAdmin ? 'Leave Approvement' : 'Leave Application';

    const tabs = [
        { id: 'employees', label: 'Employees', icon: '👥' },
        { id: 'leave', label: leaveLabel, icon: '📄' },
    ];

    return (
        <div className="space-y-6">
            {/* Dynamic Content */}
            <div className="min-h-[500px]">
                {view === 'analytics' && <AnalyticsView />}
                {isAdmin && view === 'activities' && <ActivityView />}
                {view === 'employees' && <EmployeesView />}
                {view === 'leave' && <LeaveView />}
                {view === 'leave-history' && <LeaveHistoryView />}
                {isAdmin && view === 'leave-management' && <LeaveManagementView />}
                {!isAdmin && view === 'leave-credits' && <LeaveCreditsView />}

                {view === 'settings' && <SettingsView />}
                {view === 'profile' && <ProfileSettingsView />}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <DashboardCacheProvider>
            <Suspense fallback={<div>Loading dashboard...</div>}>
                <DashboardContent />
            </Suspense>
        </DashboardCacheProvider>
    );
}
