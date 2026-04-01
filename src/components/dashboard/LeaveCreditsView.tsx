'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Employee {
    id: string;
    fullName: string;
    username?: string;
    position: string;
    status: string;
    leaveQuota: number;
    annualLeaveQuota: number;
    medicalLeaveQuota: number;
    unpaidLeaveQuota: number;
    user: {
        username: string;
        role: string;
    };
}

interface LeaveRequest {
    id: string;
    type: 'ANNUAL' | 'MEDICAL' | 'UNPAID';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    startDate: string;
    endDate: string;
}

export default function LeaveCreditsView() {
    const { data: session } = useSession();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load saved layout settings
    const [mainBoxSize, setMainBoxSize] = useState(320);
    const [typeBoxWidth, setTypeBoxWidth] = useState(180);
    const [typeRowGap, setTypeRowGap] = useState(32);
    const [typeTopGap, setTypeTopGap] = useState(48);

    const storageKey = 'leaveCreditsLayoutSettings';

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                setMainBoxSize(settings.mainBoxSize || 320);
                setTypeBoxWidth(settings.typeBoxWidth || 180);
                setTypeRowGap(settings.typeRowGap || 32);
                setTypeTopGap(settings.typeTopGap || 48);
            } catch (e) {
                console.error('Failed to load layout settings', e);
            }
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!session?.user) return;

                // Fetch all employees and find current user's employee record
                const empResponse = await fetch('/api/employees');
                const employees = await empResponse.json();
                
                // Match by username - same logic as EmployeesView
                const currentEmp = employees.find((emp: Employee) => 
                    emp.user?.username === session.user.name || 
                    emp.user?.username === (session.user as any)?.username || 
                    emp.user?.username === session.user.email
                );

                if (currentEmp) {
                    if (currentEmp.user?.role === 'ADMIN') {
                        setError('Admin accounts are exempt from leave credits; use leave management instead.');
                        setEmployee(currentEmp);
                        setLeaves([]);
                        return;
                    }

                    setEmployee(currentEmp);

                    // Fetch leave history
                    const leaveResponse = await fetch(`/api/leave?employeeId=${currentEmp.id}&limit=1000`);
                    const leaveData = await leaveResponse.json();
                    setLeaves(Array.isArray(leaveData.leaves) ? leaveData.leaves : []);
                } else {
                    setError('Employee profile not found');
                }
            } catch (err) {
                setError('Failed to load leave credits');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [session]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-gray-500">Loading leave credits...</div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-red-500">{error || 'No employee profile found'}</div>
            </div>
        );
    }

    // Calculate leave usage (days, inclusive)
    const getLeaveDuration = (leave: LeaveRequest) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffMilliseconds = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(1, diffDays);
    };

    const annualTaken = leaves
        .filter(l => l.type === 'ANNUAL' && l.status === 'APPROVED')
        .reduce((sum, l) => sum + getLeaveDuration(l), 0);
    const medicalTaken = leaves
        .filter(l => l.type === 'MEDICAL' && l.status === 'APPROVED')
        .reduce((sum, l) => sum + getLeaveDuration(l), 0);
    const unpaidTaken = leaves
        .filter(l => l.type === 'UNPAID' && l.status === 'APPROVED')
        .reduce((sum, l) => sum + getLeaveDuration(l), 0);

    const totalTaken = annualTaken + medicalTaken + unpaidTaken;
    const totalQuota = employee.leaveQuota || (employee.annualLeaveQuota + employee.medicalLeaveQuota + employee.unpaidLeaveQuota);
    const remaining = Math.max(0, totalQuota - totalTaken);

    return (
        <div className="space-y-6 flex flex-col items-center">
            {/* Page Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Credits</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Your leave balance at a glance</p>
            </div>

            {/* Main Summary Card */}
            <div
                className="rounded-3xl p-5 text-center shadow-2xl border border-blue-100 dark:border-blue-800 bg-gradient-to-b from-cyan-300 to-blue-600 text-white"
                style={{ height: `${mainBoxSize}px`, width: `${mainBoxSize}px` }}
            >
                <p className="text-xs md:text-sm font-medium tracking-wide uppercase leading-snug">YOUR TOTAL OF LEAVE CREDITS LEFT THIS YEAR IS</p>
                <div className="my-3 text-7xl md:text-8xl font-black leading-none">{remaining}</div>
                <p className="text-2xl md:text-3xl font-bold">Days of Leaves</p>
                <p className="mt-3 text-base md:text-lg">Amount of Leaves taken: <span className="font-bold">{totalTaken}</span></p>
            </div>

            {/* Type Breakdown */}
            <div
                className="grid grid-cols-1 sm:grid-cols-3 justify-items-center"
                style={{ marginTop: `${typeTopGap}px`, gap: `${typeRowGap}px` }}
            >
                <div
                    className="rounded-2xl p-3 text-center bg-gradient-to-r from-cyan-300 to-blue-500 text-white shadow-lg"
                    style={{ width: `${typeBoxWidth}px` }}
                >
                    <p className="text-sm uppercase tracking-wide">Annual Leaves Taken</p>
                    <p className="mt-2 text-4xl font-bold">{annualTaken}</p>
                </div>
                <div
                    className="rounded-2xl p-3 text-center bg-gradient-to-r from-green-300 to-teal-500 text-white shadow-lg"
                    style={{ width: `${typeBoxWidth}px` }}
                >
                    <p className="text-sm uppercase tracking-wide">Medical Leaves Taken</p>
                    <p className="mt-2 text-4xl font-bold">{medicalTaken}</p>
                </div>
                <div
                    className="rounded-2xl p-3 text-center bg-gradient-to-r from-yellow-300 to-orange-500 text-white shadow-lg"
                    style={{ width: `${typeBoxWidth}px` }}
                >
                    <p className="text-sm uppercase tracking-wide">Unpaid Leaves Taken</p>
                    <p className="mt-2 text-4xl font-bold">{unpaidTaken}</p>
                </div>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                If you wish to extend your amount of leaves, do reach out to the admin to give a reason.
            </div>
        </div>
    );
}
