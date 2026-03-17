'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface OnboardingTask {
    id: string;
    employee: { fullName: string };
    title: string;
    description: string | null;
    type: string;
    status: string;
    dueDate: string | null;
}

interface Employee {
    id: string;
    fullName: string;
}

export default function OnboardingView() {
    const [tasks, setTasks] = useState<OnboardingTask[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tskRes, empRes] = await Promise.all([
                fetch('/api/onboarding/tasks'),
                fetch('/api/directory')
            ]);

            if (tskRes.ok) setTasks(await tskRes.json());
            if (empRes.ok) setEmployees(await empRes.json());

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const res = await fetch('/api/onboarding/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData)),
            });
            if (res.ok) {
                setIsCreating(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markComplete = async (taskId: string) => {
        // In a real app this would call a PATCH /api/onboarding/tasks/[id] endpoint.
        // Modifying local state just to show the interaction.
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Onboarding & Lifecycle</h2>
                    <p className="text-sm text-gray-500">Manage new hire tasks and employee offboarding</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="rounded-md bg-[#7559e0] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#6348c5]"
                >
                    {isCreating ? 'Cancel' : 'Add Task'}
                </button>
            </div>

            {isCreating && (
                <Card className="border-[#7559e0]">
                    <CardHeader><CardTitle>Create Lifecycle Task</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Employee</label>
                                <select name="employeeId" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#7559e0] focus:ring-[#7559e0] sm:text-sm">
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Task Type</label>
                                <select name="type" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#7559e0] focus:ring-[#7559e0] sm:text-sm">
                                    <option value="ONBOARDING">Onboarding (New Joiner)</option>
                                    <option value="OFFBOARDING">Offboarding (Leaver)</option>
                                    <option value="TRANSITION">Role Transition</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Task Title</label>
                                <input name="title" required placeholder="e.g. Set up corporate email, Collect laptop" className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#7559e0] focus:ring-[#7559e0] sm:text-sm" />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Description / Instructions</label>
                                <textarea name="description" rows={2} className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#7559e0] focus:ring-[#7559e0] sm:text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Due Date</label>
                                <input name="dueDate" type="date" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#7559e0] focus:ring-[#7559e0] sm:text-sm" />
                            </div>
                            <div className="sm:col-span-2 pt-2">
                                <button type="submit" className="w-full bg-[#7559e0] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#6348c5]">Assign Task</button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7559e0] border-t-transparent"></div></div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Group tasks by employee conceptually for display, or show as flat list. We will show flat list. */}
                    {tasks.map(task => (
                        <Card key={task.id} className={`${task.status === 'COMPLETED' ? 'opacity-60 bg-gray-50' : 'border-t-4 border-t-[#7559e0]'} transition-all`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.type === 'ONBOARDING' ? 'bg-green-100 text-green-800' :
                                            task.type === 'OFFBOARDING' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {task.type}
                                    </span>
                                    {task.status === 'COMPLETED' && <span className="text-green-600 text-lg">✅</span>}
                                </div>
                                <CardTitle className="mt-2 text-lg">{task.title}</CardTitle>
                                <CardDescription className="text-gray-900 font-medium">For: {task.employee.fullName}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden">{task.description || 'No additional instructions.'}</p>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-500 font-medium">
                                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                                    </div>
                                    {task.status !== 'COMPLETED' && (
                                        <button onClick={() => markComplete(task.id)} className="text-xs bg-white border border-gray-300 rounded px-3 py-1 text-gray-700 hover:bg-gray-50 font-medium">
                                            Mark Done
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {tasks.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                            No pending onboarding or offboarding tasks.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
