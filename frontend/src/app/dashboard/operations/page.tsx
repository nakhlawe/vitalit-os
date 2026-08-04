'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { operationsAPI, patientsAPI, doctorsAPI, hospitalsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type Operation = {
  id: number;
  operation_id: string;
  patient_id: number;
  doctor_id: number;
  hospital_id: number;
  operation_type: string;
  scheduled_datetime: string;
  duration_estimated_minutes: number;
  status: string;
  pre_op_notes?: string;
  post_op_notes?: string;
  notes?: string;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled:   'bg-blue-100 text-blue-800',
  confirmed:   'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-800',
  postponed:   'bg-orange-100 text-orange-800',
};

const STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'postponed'];

const EMPTY_FORM = {
  patient_id: '',
  doctor_id: '',
  hospital_id: '',
  operation_type: '',
  scheduled_datetime: '',
  duration_estimated_minutes: '60',
  pre_op_notes: '',
  notes: '',
};

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showDetail, setShowDetail] = useState<Operation | null>(null);
  const [postOpNote, setPostOpNote] = useState('');

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [ops, pats, docs, hosps] = await Promise.all([
        operationsAPI.getAll(),
        patientsAPI.getAll(),
        doctorsAPI.getAll(),
        hospitalsAPI.getAll(),
      ]);
      setOperations(ops);
      setPatients(pats);
      setDoctors(docs);
      setHospitals(hosps);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getName = (list: any[], id: number, first: string, last: string) => {
    const item = list.find((x) => x.id === id);
    return item ? `${item[first]} ${item[last]}`.trim() : `#${id}`;
  };

  const patientName = (id: number) => getName(patients, id, 'first_name', 'last_name');
  const doctorName = (id: number) => getName(doctors, id, 'first_name', 'last_name');
  const hospitalName = (id: number) => {
    const h = hospitals.find((x) => x.id === id);
    return h?.name ?? `#${id}`;
  };

  const filtered = operations.filter((op) => {
    const matchSearch = !search || op.operation_type.toLowerCase().includes(search.toLowerCase()) ||
      patientName(op.patient_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || op.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (op: Operation) => {
    setEditing(op);
    setForm({
      patient_id: String(op.patient_id),
      doctor_id: String(op.doctor_id),
      hospital_id: String(op.hospital_id),
      operation_type: op.operation_type,
      scheduled_datetime: op.scheduled_datetime?.slice(0, 16) ?? '',
      duration_estimated_minutes: String(op.duration_estimated_minutes),
      pre_op_notes: op.pre_op_notes ?? '',
      notes: op.notes ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        hospital_id: Number(form.hospital_id),
        operation_type: form.operation_type,
        scheduled_datetime: form.scheduled_datetime,
        duration_estimated_minutes: Number(form.duration_estimated_minutes) || 60,
        pre_op_notes: form.pre_op_notes || null,
        notes: form.notes || null,
      };
      if (editing) await operationsAPI.update(editing.id, payload);
      else await operationsAPI.create(payload);
      setShowForm(false);
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: number, status: string) => {
    await operationsAPI.update(id, { status });
    await fetchAll();
  };

  const handlePostOp = async () => {
    if (!showDetail) return;
    await operationsAPI.update(showDetail.id, { post_op_notes: postOpNote, status: 'completed' });
    setShowDetail(null);
    await fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this operation?')) return;
    await operationsAPI.delete(id);
    await fetchAll();
  };

  const stats = [
    { label: 'Total', value: operations.length, color: 'text-blue-600' },
    { label: 'Scheduled', value: operations.filter(o => o.status === 'scheduled').length, color: 'text-indigo-600' },
    { label: 'Completed', value: operations.filter(o => o.status === 'completed').length, color: 'text-green-600' },
    { label: 'Cancelled', value: operations.filter(o => o.status === 'cancelled').length, color: 'text-red-600' },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
          <p className="text-gray-600 mt-1">Schedule and track surgical operations across hospitals</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Schedule Operation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className={cn('text-3xl font-bold', s.color)}>{s.value}</div>
              <div className="text-sm text-gray-600 mt-1">{s.label} Operations</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <Input placeholder="Search by type or patient..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Patient', 'Doctor', 'Hospital', 'Type', 'Scheduled', 'Duration', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No operations found. <button onClick={openAdd} className="text-blue-600 underline">Schedule one</button>
                    </td>
                  </tr>
                ) : filtered.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-sm text-gray-900">{patientName(op.patient_id)}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">Dr. {doctorName(op.doctor_id)}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{hospitalName(op.hospital_id)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{op.operation_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(op.scheduled_datetime).toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{op.duration_estimated_minutes} min</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[op.status] ?? 'bg-gray-100 text-gray-700')}>
                        {op.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs" onClick={() => { setShowDetail(op); setPostOpNote(op.post_op_notes ?? ''); }}>
                          Notes
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => openEdit(op)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <select
                          value={op.status}
                          onChange={(e) => handleStatus(op.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1 py-1 text-gray-600"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(op.id)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editing ? 'Edit' : 'Schedule'} Operation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                  <option value="">Select patient...</option>
                  {patients.map((p: any) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
                  <option value="">Select doctor...</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}>
                  <option value="">Select hospital...</option>
                  {hospitals.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type *</label>
                <Input value={form.operation_type} onChange={(e) => setForm({ ...form, operation_type: e.target.value })} placeholder="e.g. Appendectomy" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                  <Input type="datetime-local" value={form.scheduled_datetime} onChange={(e) => setForm({ ...form, scheduled_datetime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <Input type="number" value={form.duration_estimated_minutes} onChange={(e) => setForm({ ...form, duration_estimated_minutes: e.target.value })} min={1} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pre-op Notes</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" rows={2} value={form.pre_op_notes} onChange={(e) => setForm({ ...form, pre_op_notes: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving || !form.patient_id || !form.doctor_id || !form.hospital_id || !form.operation_type || !form.scheduled_datetime} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Post-op Notes Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Operation Notes</CardTitle>
              <CardDescription>{showDetail.operation_type} — {patientName(showDetail.patient_id)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDetail.pre_op_notes && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Pre-op Notes</div>
                  <div className="text-sm text-gray-800 bg-gray-50 rounded p-3">{showDetail.pre_op_notes}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post-op Notes</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" rows={4} value={postOpNote} onChange={(e) => setPostOpNote(e.target.value)} placeholder="Enter post-operation notes..." />
              </div>
              <div className="flex gap-3">
                <Button onClick={handlePostOp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Save & Mark Completed</Button>
                <Button variant="outline" onClick={() => setShowDetail(null)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
