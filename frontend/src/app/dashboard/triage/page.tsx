'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { triageAPI, patientsAPI, appointmentsAPI, branchesAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type TriageRecord = {
  id: number;
  triage_id: string;
  patient_id: number;
  appointment_id?: number;
  branch_id?: number;
  vital_signs?: Record<string, any>;
  chief_complaint?: string;
  triage_notes?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assessed_at: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high:   'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low:    'bg-gray-100 text-gray-700 border-gray-200',
};

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  normal: 'bg-blue-500',
  low:    'bg-gray-400',
};

const EMPTY_VITALS = { bp: '', pulse: '', temp: '', weight: '', height: '', spo2: '' };

type Priority = 'urgent' | 'high' | 'normal' | 'low';

const EMPTY_FORM: {
  patient_id: string;
  appointment_id: string;
  branch_id: string;
  chief_complaint: string;
  triage_notes: string;
  priority: Priority;
} = {
  patient_id: '',
  appointment_id: '',
  branch_id: '',
  chief_complaint: '',
  triage_notes: '',
  priority: 'normal',
};

export default function TriagePage() {
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TriageRecord | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [saving, setSaving] = useState(false);

  const [showDetail, setShowDetail] = useState<TriageRecord | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [recs, pats, appts, brs] = await Promise.all([
        triageAPI.getAll(),
        patientsAPI.getAll(),
        appointmentsAPI.getAll(),
        branchesAPI.getAll(),
      ]);
      setRecords(recs);
      setPatients(pats);
      setAppointments(appts);
      setBranches(brs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const patientName = (id?: number) => {
    if (!id) return '—';
    const p = patients.find((x) => x.id === id);
    return p ? `${p.first_name} ${p.last_name}` : `#${id}`;
  };

  const branchName = (id?: number) => {
    if (!id) return '—';
    const b = branches.find((x) => x.id === id);
    return b?.name ?? `#${id}`;
  };

  const filtered = records.filter((r) => {
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchSearch = !search || patientName(r.patient_id).toLowerCase().includes(search.toLowerCase()) || (r.chief_complaint ?? '').toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchSearch;
  }).sort((a, b) => {
    const order = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setVitals(EMPTY_VITALS);
    setShowForm(true);
  };

  const openEdit = (r: TriageRecord) => {
    setEditing(r);
    setForm({
      patient_id: String(r.patient_id),
      appointment_id: r.appointment_id ? String(r.appointment_id) : '',
      branch_id: r.branch_id ? String(r.branch_id) : '',
      chief_complaint: r.chief_complaint ?? '',
      triage_notes: r.triage_notes ?? '',
      priority: r.priority,
    });
    setVitals({
      bp: r.vital_signs?.bp ?? '',
      pulse: String(r.vital_signs?.pulse ?? ''),
      temp: String(r.vital_signs?.temp ?? ''),
      weight: String(r.vital_signs?.weight ?? ''),
      height: String(r.vital_signs?.height ?? ''),
      spo2: String(r.vital_signs?.spo2 ?? ''),
    });
    setShowForm(true);
  };

  const buildVitals = () => {
    const v: Record<string, any> = {};
    if (vitals.bp) v.bp = vitals.bp;
    if (vitals.pulse) v.pulse = Number(vitals.pulse);
    if (vitals.temp) v.temp = Number(vitals.temp);
    if (vitals.weight) v.weight = Number(vitals.weight);
    if (vitals.height) v.height = Number(vitals.height);
    if (vitals.spo2) v.spo2 = Number(vitals.spo2);
    return Object.keys(v).length ? v : null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        appointment_id: form.appointment_id ? Number(form.appointment_id) : null,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        vital_signs: buildVitals(),
        chief_complaint: form.chief_complaint || null,
        triage_notes: form.triage_notes || null,
        priority: form.priority,
      };
      if (editing) await triageAPI.update(editing.id, payload);
      else await triageAPI.create(payload);
      setShowForm(false);
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this triage record?')) return;
    await triageAPI.delete(id);
    await fetchAll();
  };

  const counts = {
    urgent: records.filter(r => r.priority === 'urgent').length,
    high:   records.filter(r => r.priority === 'high').length,
    normal: records.filter(r => r.priority === 'normal').length,
    low:    records.filter(r => r.priority === 'low').length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Triage</h1>
          <p className="text-gray-600 mt-1">Assistant doctor pre-assessment before main consultation</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Assessment
        </Button>
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { key: 'high',   label: 'High',   color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
          { key: 'normal', label: 'Normal', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { key: 'low',    label: 'Low',    color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setPriorityFilter(priorityFilter === s.key ? 'all' : s.key)}
            className={cn('text-left p-4 rounded-xl border-2 transition-all hover:shadow-md', s.bg, priorityFilter === s.key ? 'ring-2 ring-offset-1 ring-blue-400' : '')}
          >
            <div className={cn('text-3xl font-bold', s.color)}>{counts[s.key as keyof typeof counts]}</div>
            <div className={cn('text-sm font-medium mt-1', s.color)}>{s.label} Priority</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input placeholder="Search by patient or complaint..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            {priorityFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setPriorityFilter('all')}>Clear Filter</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Priority', 'Patient', 'Branch', 'Chief Complaint', 'Vital Signs', 'Assessed At', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      No triage records found. <button onClick={openAdd} className="text-blue-600 underline">Add one</button>
                    </td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', PRIORITY_COLORS[r.priority])}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOTS[r.priority])} />
                        {r.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-sm text-gray-900">{patientName(r.patient_id)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{branchName(r.branch_id)}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">{r.chief_complaint || '—'}</td>
                    <td className="py-3 px-4">
                      {r.vital_signs ? (
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {r.vital_signs.bp && <div>BP: <span className="font-medium">{r.vital_signs.bp}</span></div>}
                          {r.vital_signs.pulse && <div>Pulse: <span className="font-medium">{r.vital_signs.pulse} bpm</span></div>}
                          {r.vital_signs.temp && <div>Temp: <span className="font-medium">{r.vital_signs.temp}°C</span></div>}
                          {r.vital_signs.spo2 && <div>SpO2: <span className="font-medium">{r.vital_signs.spo2}%</span></div>}
                        </div>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(r.assessed_at).toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs" onClick={() => setShowDetail(r)}>View</Button>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => openEdit(r)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(r.id)}>
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
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editing ? 'Edit' : 'New'} Triage Assessment</CardTitle>
              <CardDescription>Record patient vitals and initial assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Patient / Branch / Appointment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p: any) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                    <option value="">Select branch...</option>
                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linked Appointment</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value })}>
                    <option value="">No appointment</option>
                    {appointments.filter((a: any) => !form.patient_id || String(a.patient_id) === form.patient_id).map((a: any) => (
                      <option key={a.id} value={a.id}>{a.appointment_id} — {new Date(a.scheduled_datetime).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <div className="flex gap-2">
                  {(['urgent', 'high', 'normal', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, priority: p })}
                      className={cn('flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all capitalize',
                        form.priority === p
                          ? PRIORITY_COLORS[p] + ' border-current'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vital Signs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vital Signs</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'bp',     label: 'BP',     placeholder: '120/80' },
                    { key: 'pulse',  label: 'Pulse',  placeholder: '72 bpm' },
                    { key: 'temp',   label: 'Temp °C', placeholder: '37.0' },
                    { key: 'weight', label: 'Weight kg', placeholder: '70' },
                    { key: 'height', label: 'Height cm', placeholder: '170' },
                    { key: 'spo2',   label: 'SpO2 %', placeholder: '98' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <Input
                        placeholder={placeholder}
                        value={(vitals as any)[key]}
                        onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaints / Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={2}
                  placeholder="Patient's main complaint..."
                  value={form.chief_complaint}
                  onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={3}
                  placeholder="Assistant doctor's notes for the main doctor..."
                  value={form.triage_notes}
                  onChange={(e) => setForm({ ...form, triage_notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving || !form.patient_id} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? <LoadingSpinner size="sm" /> : 'Save Assessment'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{patientName(showDetail.patient_id)}</CardTitle>
                  <CardDescription>{new Date(showDetail.assessed_at).toLocaleString()}</CardDescription>
                </div>
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border', PRIORITY_COLORS[showDetail.priority])}>
                  <span className={cn('w-2 h-2 rounded-full', PRIORITY_DOTS[showDetail.priority])} />
                  {showDetail.priority.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDetail.vital_signs && Object.keys(showDetail.vital_signs).length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'bp', label: 'Blood Pressure', unit: '' },
                    { key: 'pulse', label: 'Pulse', unit: 'bpm' },
                    { key: 'temp', label: 'Temperature', unit: '°C' },
                    { key: 'weight', label: 'Weight', unit: 'kg' },
                    { key: 'height', label: 'Height', unit: 'cm' },
                    { key: 'spo2', label: 'SpO2', unit: '%' },
                  ].filter(v => showDetail.vital_signs![v.key] !== undefined).map(({ key, label, unit }) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{showDetail.vital_signs![key]}{unit}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              )}
              {showDetail.chief_complaint && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Chief Complaint</div>
                  <div className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{showDetail.chief_complaint}</div>
                </div>
              )}
              {showDetail.triage_notes && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Assessment Notes</div>
                  <div className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{showDetail.triage_notes}</div>
                </div>
              )}
              {showDetail.branch_id && (
                <div className="text-sm text-gray-600">Branch: <span className="font-medium">{branchName(showDetail.branch_id)}</span></div>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => { openEdit(showDetail); setShowDetail(null); }} variant="outline" className="flex-1">Edit</Button>
                <Button onClick={() => setShowDetail(null)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
