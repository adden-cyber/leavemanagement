'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Course {
    id: string;
    title: string;
    description: string;
    provider: string | null;
    link: string | null;
    mandatory: boolean;
    _count: { employees: number };
    createdAt: string;
}

export default function TrainingView() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [provider, setProvider] = useState('');
    const [link, setLink] = useState('');
    const [mandatory, setMandatory] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/training/courses');
            if (res.ok) {
                setCourses(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/training/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, provider, link, mandatory }),
            });
            if (res.ok) {
                setIsCreating(false);
                setTitle('');
                setDescription('');
                setProvider('');
                setLink('');
                setMandatory(false);
                fetchCourses();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Training & Development</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage learning courses and employee skills</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-[0.98]"
                >
                    {isCreating ? (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Cancel</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Course</>
                    )}
                </button>
            </div>

            {/* Course Creation Form */}
            {isCreating && (
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">Add New Course</h3>
                    </div>

                    <form onSubmit={handleCreate} className="p-6 sm:p-8 space-y-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced Leadership Skills" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all sm:text-sm outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will employees learn from this course?" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all sm:text-sm resize-y outline-none" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                                <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g., Internal, Coursera" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all sm:text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Course Link (URL)</label>
                                <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all sm:text-sm outline-none" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <input type="checkbox" id="mandatory" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-offset-amber-50 cursor-pointer" />
                            <label htmlFor="mandatory" className="text-sm font-semibold text-amber-900 cursor-pointer">This is a mandatory compliance course for all employees</label>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all active:scale-[0.98] w-full md:w-auto justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Create Course
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600"></div></div>
            ) : courses.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No courses found</h3>
                    <p className="text-slate-500 max-w-sm">There are currently no training courses available. Add a new course to get started.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <div key={course.id} className="group relative bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
                            {/* Decorative top border */}
                            <div className={`h-1.5 w-full ${course.mandatory ? 'bg-amber-500' : 'bg-blue-500'}`} />

                            {course.mandatory && (
                                <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider shadow-sm z-10 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    MANDATORY
                                </div>
                            )}

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start gap-3 mb-3 pr-20">
                                    <div className={`mt-0.5 p-2 rounded-lg ${course.mandatory ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors" title={course.title}>
                                        {course.title}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    {course.provider || 'Internal Course'}
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1 line-clamp-3">
                                    {course.description}
                                </p>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        <span className="text-slate-900 font-bold">{course._count.employees}</span> Enrolled
                                    </div>
                                    {course.link && (
                                        <a href={course.link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group/link">
                                            View Course
                                            <svg className="w-4 h-4 transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
