'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useDashboardCache } from '@/lib/DashboardCacheContext';

interface DirectoryEmployee {
    id: string;
    fullName: string;
    position: string;
    department: string;
    user: {
        id: string;
        email: string;
    };
}

export default function DirectoryView() {
    const { data: session } = useSession();
    const { getCache, setCache } = useDashboardCache();
    const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [employeeStats, setEmployeeStats] = useState<any>(null);
    const [statLoading, setStatLoading] = useState(false);

    useEffect(() => {
        async function fetchDirectory() {
            // Check cache first
            const cachedDirectory = getCache('directory_employees');
            if (cachedDirectory) {
                setEmployees(cachedDirectory);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await fetch('/api/directory');
                if (res.ok) {
                    const data = await res.json();
                    setEmployees(data);
                    setCache('directory_employees', data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDirectory();
    }, []);

    const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
        return matchesSearch && matchesDept;
    });

    const handleCardClick = async (employee: DirectoryEmployee) => {
        // Check permissions: only admins or the employee themselves can view stats
        const isAdmin = session?.user?.role === 'ADMIN';
        const isOwnProfile = session?.user?.id === employee.user.id;
        
        if (!isAdmin && !isOwnProfile) {
            alert('You do not have permission to view this employee\'s profile.');
            return;
        }

        setSelectedEmployeeId(employee.id);
        setStatLoading(true);
        try {
            const res = await fetch(`/api/directory/${employee.id}`);
            if (res.ok) {
                const data = await res.json();
                setEmployeeStats(data);
            } else {
                setEmployeeStats(null);
            }
        } catch (error) {
            console.error(error);
            setEmployeeStats(null);
        } finally {
            setStatLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedEmployeeId(null);
        setEmployeeStats(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#7559e0]/10 rounded-xl">
                        <svg className="w-6 h-6 text-[#7559e0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Company Directory</h2>
                        <p className="text-sm text-slate-500 mt-1">Find colleagues and view the organization structure.</p>
                    </div>
                </div>
            </div>

            {/* Filters & Categories */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-3">
                {/* Search Bar */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-0.5">Search Directory</label>
                    <div className="flex items-center gap-3 md:max-w-md">
                        <div className="flex items-center justify-center text-slate-400 text-lg">
                            🔍
                        </div>
                        <input
                            type="text"
                            placeholder="Search by employee name or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 hover:bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7559e0]/20 focus:border-[#7559e0] sm:text-sm transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Department Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Departments</label>
                    <div className="flex flex-wrap gap-3">
                        {departments.map((dept) => {
                            const isSelected = departmentFilter === dept;
                            return (
                                <button
                                    key={dept}
                                    onClick={() => setDepartmentFilter(dept)}
                                    className={`
                                        flex-1 min-w-[120px] py-2 px-4 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 text-center
                                        ${isSelected
                                            ? 'border-2 border-[#7559e0] text-[#7559e0] shadow-sm'
                                            : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {dept}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Employee Grid */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-12 h-12 border-4 border-[#7559e0]/20 border-t-[#7559e0] rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading directory...</p>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-16 text-center animate-in fade-in">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No employees found</h3>
                        <p className="text-slate-500 text-sm max-w-sm">No one matches your current search criteria.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredEmployees.map((employee) => (
                        <Card
                            key={employee.id}
                            onClick={() => handleCardClick(employee)}
                            className="bg-white rounded-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 shadow-sm hover:shadow-md hover:border-[#7559e0]/30 overflow-hidden group cursor-pointer"
                        >
                            <div className="h-24 bg-gradient-to-r from-[#7559e0] to-[#5939b8]"></div>
                            <CardContent className="pt-0 relative px-6 pb-6 text-center">
                                {/* Avatar */}
                                <div className="w-20 h-20 mx-auto -mt-10 rounded-full border-4 border-white bg-white flex items-center justify-center text-3xl shadow-sm text-[#7559e0] font-bold">
                                    {employee.fullName.charAt(0)}
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-[#7559e0] transition-colors">{employee.fullName}</h3>
                                <p className="text-sm font-medium text-[#7559e0] mt-1">{employee.position}</p>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">🏢 {employee.department}</span>
                                    <span className="flex items-center gap-1 text-xs truncate max-w-full">✉️ {employee.user.email}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Employee Stats Modal */}
            {selectedEmployeeId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all scale-100 flex flex-col max-h-auto">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                            <h2 className="text-2xl font-bold text-slate-900">Employee Profile</h2>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto">
                            {statLoading ? (
                                <div className="flex justify-center items-center h-32"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7559e0] border-t-transparent"></div></div>
                            ) : employeeStats ? (
                                <div className="space-y-6">
                                    {/* Profile Summary */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7559e0] to-[#5939b8] flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0">
                                            {employeeStats.fullName.charAt(0)}
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h3 className="text-xl font-bold text-slate-900">{employeeStats.fullName}</h3>
                                            <p className="text-base text-[#7559e0] font-medium mt-1">{employeeStats.position}</p>
                                            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">🏢 {employeeStats.department}</span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">✉️ {employeeStats.email}</span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">📅 {new Date(employeeStats.joinDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                                        <div className="bg-green-50/50 border border-green-100 rounded-lg p-3 text-center">
                                            <p className="text-xs text-green-600 font-semibold mb-1">Present</p>
                                            <p className="text-2xl font-bold text-green-700">{employeeStats.stats.presentDays}</p>
                                        </div>
                                        <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-center">
                                            <p className="text-xs text-red-600 font-semibold mb-1">Absent</p>
                                            <p className="text-2xl font-bold text-red-700">{employeeStats.stats.absentDays}</p>
                                        </div>
                                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-center">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Leaves</p>
                                            <p className="text-2xl font-bold text-blue-700">{employeeStats.stats.totalLeaves} days</p>
                                        </div>
                                    </div>

                                    {/* Leave Breakdown - Only shown if available */}
                                    {employeeStats.stats.leaveBreakdown && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <h4 className="text-base font-bold text-slate-900 mb-3">Leave Breakdown</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-blue-600 font-semibold mb-1">Annual</p>
                                                    <p className="text-xl font-bold text-blue-700">{employeeStats.stats.leaveBreakdown.annual} days</p>
                                                </div>
                                                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-red-600 font-semibold mb-1">Medical</p>
                                                    <p className="text-xl font-bold text-red-700">{employeeStats.stats.leaveBreakdown.medical} days</p>
                                                </div>
                                                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-amber-600 font-semibold mb-1">Unpaid</p>
                                                    <p className="text-xl font-bold text-amber-700">{employeeStats.stats.leaveBreakdown.unpaid} days</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Activity */}
                                    {employeeStats.recentAttendance && employeeStats.recentAttendance.length > 0 && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <h4 className="text-base font-bold text-slate-900 mb-2">Recent Attendance</h4>
                                            <div className="space-y-2">
                                                {employeeStats.recentAttendance.map((record: any) => (
                                                    <div key={record.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{new Date(record.date).toLocaleDateString()}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                In: {new Date(record.checkIn).toLocaleTimeString()}
                                                                {record.checkOut ? ` - Out: ${new Date(record.checkOut).toLocaleTimeString()}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                                            record.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {record.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    Failed to load profile details.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
