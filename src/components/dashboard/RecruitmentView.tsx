'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface JobPosting {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    status: string;
    description: string;
    _count?: {
        applicants: number;
    }
}

interface Applicant {
    id: string;
    jobPostingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    notes: string | null;
    jobPosting?: {
        title: string;
        department: string;
    }
}

export default function RecruitmentView() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'jobs' | 'applicants'>('jobs');
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

    // Forms
    const [jobForm, setJobForm] = useState({
        title: '', department: 'Engineering', location: 'Remote', type: 'FULL_TIME', description: ''
    });

    const [applicantForm, setApplicantForm] = useState({
        jobPostingId: '', firstName: '', lastName: '', email: '', phone: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                fetch('/api/jobs'),
                fetch('/api/applicants')
            ]);

            if (jobsRes.ok) setJobs(await jobsRes.json());
            if (appsRes.ok) setApplicants(await appsRes.json());
        } catch (error) {
            console.error("Failed to fetch recruitment data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = selectedJob ? 'PUT' : 'POST';
            const body = selectedJob ? { ...jobForm, id: selectedJob.id } : jobForm;

            const res = await fetch('/api/jobs', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsJobModalOpen(false);
                setJobForm({ title: '', department: 'Engineering', location: 'Remote', type: 'FULL_TIME', description: '' });
                setSelectedJob(null);
                fetchData();
            }
        } catch (error) {
            console.error("Save job error", error);
        }
    };

    const handleSaveApplicant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/applicants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(applicantForm)
            });

            if (res.ok) {
                setIsApplicantModalOpen(false);
                setApplicantForm({ jobPostingId: '', firstName: '', lastName: '', email: '', phone: '' });
                fetchData();
            }
        } catch (error) {
            console.error("Add applicant error", error);
        }
    };

    const updateApplicantStatus = async (id: string, status: string, notes?: string) => {
        try {
            const res = await fetch('/api/applicants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, notes })
            });
            if (res.ok) fetchData();
        } catch (error) {
            console.error("Update status error", error);
        }
    };

    const toggleJobStatus = async (job: JobPosting) => {
        try {
            const newStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
            const res = await fetch('/api/jobs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: job.id, status: newStatus })
            });
            if (res.ok) fetchData();
        } catch (error) {
            console.error("Toggle job status error", error);
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading recruitment data...</div>;

    const PIPELINE_STAGES = ["APPLIED", "REVIEW", "INTERVIEW", "OFFERED", "REJECTED"];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recruitment & ATS</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage job postings and track applicant pipeline</p>
                    </div>
                </div>
                {isAdmin && activeTab === 'jobs' && (
                    <button
                        onClick={() => {
                            setSelectedJob(null);
                            setJobForm({ title: '', department: 'Engineering', location: 'Remote', type: 'FULL_TIME', description: '' });
                            setIsJobModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-teal-500/20 transition-all active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Create Job Posting
                    </button>
                )}
                {activeTab === 'applicants' && (
                    <button
                        onClick={() => {
                            setApplicantForm({ jobPostingId: jobs[0]?.id || '', firstName: '', lastName: '', email: '', phone: '' });
                            setIsApplicantModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-teal-500/20 transition-all active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Manually Add Applicant
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-slate-200 pb-px">
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'jobs' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'}`}
                >
                    Job Postings
                    {activeTab === 'jobs' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('applicants')}
                    className={`relative px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'applicants' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'}`}
                >
                    Applicant Pipeline
                    {activeTab === 'applicants' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Jobs View */}
            {activeTab === 'jobs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {jobs.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No job postings</h3>
                            <p className="text-slate-500 text-sm text-center max-w-sm">There are no job postings currently active. Create one to start recruiting candidates.</p>
                        </div>
                    ) : jobs.map(job => (
                        <div key={job.id} className="group relative bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
                            {job.status === 'CLOSED' && (
                                <div className="absolute top-4 right-4 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md z-10">CLOSED</div>
                            )}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${job.department === 'Engineering' ? 'bg-blue-50 text-blue-600' : job.department === 'Design' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'}`}>
                                        {job.department}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1 mb-1">{job.title}</h3>

                                <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-4 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-md">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {job.location}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-md">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {job.type.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <div className="w-7 h-7 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-teal-700">{job._count?.applicants || 0}</div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600">Applicants</span>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleJobStatus(job)}
                                            title={job.status === 'OPEN' ? 'Close Job' : 'Reopen Job'}
                                            className={`p-1.5 rounded-lg transition-colors ${job.status === 'OPEN' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                        >
                                            {job.status === 'OPEN' ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedJob(job);
                                                setJobForm({
                                                    title: job.title, department: job.department,
                                                    location: job.location, type: job.type, description: job.description
                                                });
                                                setIsJobModalOpen(true);
                                            }}
                                            title="Edit Job"
                                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Applicant Pipeline View (Simple List for MVP) */}
            {activeTab === 'applicants' && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Applicant</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Applied Position</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Stage</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Notes</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {applicants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                </div>
                                                <p className="text-sm font-medium">No applicants yet in the pipeline.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : applicants.map(app => (
                                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shadow-inner">
                                                    {app.firstName[0]}{app.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{app.firstName} {app.lastName}</div>
                                                    <div className="text-xs text-slate-500">{app.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-900">{app.jobPosting?.title}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{app.jobPosting?.department}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative inline-block">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => updateApplicantStatus(app.id, e.target.value, app.notes || '')}
                                                    disabled={!isAdmin}
                                                    className={`appearance-none text-xs font-bold pr-8 pl-3 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer transition-all h-8 flex items-center
                                                        ${app.status === 'APPLIED' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : ''}
                                                        ${app.status === 'REVIEW' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''}
                                                        ${app.status === 'INTERVIEW' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : ''}
                                                        ${app.status === 'OFFERED' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''}
                                                        ${app.status === 'REJECTED' ? 'bg-red-50 text-red-700 hover:bg-red-100' : ''}
                                                    `}
                                                >
                                                    {PIPELINE_STAGES.map(stage => (
                                                        <option key={stage} value={stage}>{stage}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group/input">
                                                <input
                                                    type="text"
                                                    defaultValue={app.notes || ''}
                                                    onBlur={(e) => updateApplicantStatus(app.id, app.status, e.target.value)}
                                                    placeholder="Add a note..."
                                                    disabled={!isAdmin}
                                                    className="text-sm border border-transparent bg-transparent hover:border-slate-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 text-slate-700 placeholder-slate-400 w-full transition-all px-3 py-2 rounded-xl outline-none"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`mailto:${app.email}`}
                                                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                                                title="Send Email"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Job Form Modal */}
            {isJobModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">{selectedJob ? 'Edit' : 'Create'} Job Posting</h3>
                            <button onClick={() => setIsJobModalOpen(false)} className="text-slate-400 hover:text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveJob} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                                <input
                                    type="text" required
                                    value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                    placeholder="e.g. Senior Frontend Developer"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                    <input
                                        type="text" required
                                        value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text" required
                                        value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select
                                        value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                    >
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    required rows={4}
                                    value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsJobModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Save Job Posting
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Applicant Form Modal */}
            {isApplicantModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Manually Add Applicant</h3>
                            <button onClick={() => setIsApplicantModalOpen(false)} className="text-slate-400 hover:text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveApplicant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Apply for Job</label>
                                <select
                                    required
                                    value={applicantForm.jobPostingId} onChange={e => setApplicantForm({ ...applicantForm, jobPostingId: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                >
                                    <option value="" disabled>Select a job...</option>
                                    {jobs.filter(j => j.status === 'OPEN').map(job => (
                                        <option key={job.id} value={job.id}>{job.title} ({job.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                    <input
                                        type="text" required
                                        value={applicantForm.firstName} onChange={e => setApplicantForm({ ...applicantForm, firstName: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text" required
                                        value={applicantForm.lastName} onChange={e => setApplicantForm({ ...applicantForm, lastName: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email" required
                                    value={applicantForm.email} onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all sm:text-sm outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsApplicantModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Applicant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
