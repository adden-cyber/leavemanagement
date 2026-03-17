'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

type Attendance = {
    id: string;
    date: string;
    checkIn: string;
    checkOut: string | null;
    status: string;
    employee: { fullName: string };
};

export default function AttendancePage() {
    const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await fetch('/api/attendance');
                if (res.ok) {
                    const data = await res.json();
                    setAttendanceList(data);
                }
            } catch (error) {
                console.error("Failed to fetch attendance", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [refresh]);

    const handleCheckIn = async () => {
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'check-in' }),
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                alert("Checked In Successfully!");
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCheckOut = async () => {
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'check-out' }),
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                alert("Checked Out Successfully!");
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(attendanceList.map(a => ({
            Employee: a.employee.fullName,
            Date: new Date(a.date).toLocaleDateString(),
            CheckIn: new Date(a.checkIn).toLocaleTimeString(),
            CheckOut: a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-',
            Status: a.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, "Attendance_Report.xlsx");
    };

    if (loading) return <div>Loading...</div>;

    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceList.find(a => a.date.startsWith(today));
    const isCheckedIn = !!todayRecord;
    const isCheckedOut = !!todayRecord?.checkOut;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendance</h1>
                    <p className="text-slate-500 mt-2 text-lg">Track daily attendance and work hours.</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                    Export Report
                </button>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-md">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Today's Action</h3>
                <div className="flex gap-6">
                    <button
                        onClick={handleCheckIn}
                        disabled={isCheckedIn}
                        className={`flex-1 py-4 px-6 rounded-lg font-bold text-base transition-all ${isCheckedIn
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-[0.99]'
                            }`}
                    >
                        {isCheckedIn ? 'Checked In' : 'Check In'}
                    </button>
                    <button
                        onClick={handleCheckOut}
                        disabled={!isCheckedIn || isCheckedOut}
                        className={`flex-1 py-4 px-6 rounded-lg font-bold text-base transition-all ${!isCheckedIn || isCheckedOut
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-white border-2 border-red-50 text-red-600 hover:bg-red-50 hover:border-red-100 shadow-sm'
                            }`}
                    >
                        {isCheckedOut ? 'Checked Out' : 'Check Out'}
                    </button>
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white border border-slate-100 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 font-semibold text-slate-700">Employee</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Date</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Check In</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Check Out</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attendanceList.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">No attendance records found.</td></tr>
                            ) : (
                                attendanceList.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-medium text-slate-900">{record.employee.fullName}</td>
                                        <td className="px-8 py-5 text-slate-600">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 text-slate-600">{new Date(record.checkIn).toLocaleTimeString()}</td>
                                        <td className="px-8 py-5 text-slate-600">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
