'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { branchesAPI, hospitalsAPI, doctorsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type Tab = 'branches' | 'hospitals';

type Branch = {
  id: number;
  branch_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
};

type Hospital = {
  id: number;
  hospital_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
};

type Doctor = { id: number; first_name: string; last_name: string; specialization: string; consultation_fee: number };

const EMPTY_BRANCH = { name: '', address: '', phone: '', email: '', is_active: true };
const EMPTY_HOSPITAL = { name: '', address: '', phone: '', email: '', is_active: true };

export default function BranchesPage() {
  const [tab, setTab] = useState<Tab>('branches');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | Hospital | null>(null);
  const [form, setForm] = useState<typeof EMPTY_BRANCH>(EMPTY_BRANCH);
  const [saving, setSaving] = useState(false);

  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchDoctors, setBranchDoctors] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [assignForm, setAssignForm] = useState({ doctor_id: '', consultation_fee: '', schedule_days: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [b, h] = await Promise.all([branchesAPI.getAll(), hospitalsAPI.getAll()]);
      setBranches(b);
      setHospitals(h);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = (tab === 'branches' ? branches : hospitals).filter(
    (x) => x.name.toLowerCase().includes(search.toLowerCase()) || (x.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_BRANCH);
    setShowForm(true);
  };

  const openEdit = (item: Branch | Hospital) => {
    setEditing(item);
    setForm({ name: item.name, address: item.address ?? '', phone: item.phone ?? '', email: item.email ?? '', is_active: item.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'branches') {
        if (editing) await branchesAPI.update(editing.id, form);
        else await branchesAPI.create(form);
      } else {
        if (editing) await hospitalsAPI.update(editing.id, form);
        else await hospitalsAPI.create(form);
      }
      setShowForm(false);
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (tab === 'branches') await branchesAPI.delete(id);
    else await hospitalsAPI.delete(id);
    await fetchData();
  };

  const openDoctors = async (branch: Branch) => {
    setSelectedBranch(branch);
    const [docs, allDocs] = await Promise.all([
      branchesAPI.getDoctors(branch.id),
      doctorsAPI.getAll(),
    ]);
    setBranchDoctors(docs);
    setAllDoctors(allDocs as Doctor[]);
    setAssignForm({ doctor_id: '', consultation_fee: '', schedule_days: '' });
    setShowDoctorsModal(true);
  };

  const handleAssign = async () => {
    if (!selectedBranch || !assignForm.doctor_id) return;
    await branchesAPI.assignDoctor(selectedBranch.id, {
      doctor_id: Number(assignForm.doctor_id),
      consultation_fee: Number(assignForm.consultation_fee) || 0,
      schedule_days: assignForm.schedule_days || null,
    });
    const docs = await branchesAPI.getDoctors(selectedBranch.id);
    setBranchDoctors(docs);
    setAssignForm({ doctor_id: '', consultation_fee: '', schedule_days: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branches & Hospitals</h1>
          <p className="text-gray-600 mt-1">Manage clinic branches and operation hospitals</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add {tab === 'branches' ? 'Branch' : 'Hospital'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Branches', value: branches.length, color: 'blue' },
          { label: 'Active Branches', value: branches.filter(b => b.is_active).length, color: 'green' },
          { label: 'Total Hospitals', value: hospitals.length, color: 'purple' },
          { label: 'Active Hospitals', value: hospitals.filter(h => h.is_active).length, color: 'orange' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className={cn('text-3xl font-bold', {
                'text-blue-600': s.color === 'blue',
                'text-green-600': s.color === 'green',
                'text-purple-600': s.color === 'purple',
                'text-orange-600': s.color === 'orange',
              })}>{s.value}</div>
              <div className="text-sm text-gray-600 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              {(['branches', 'hospitals'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(''); }}
                  className={cn('px-4 py-2 rounded-md text-sm font-medium transition-all', tab === t ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900')}
                >
                  {t === 'branches' ? 'Branches' : 'Hospitals'}
                </button>
              ))}
            </div>
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-72" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Address</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      No {tab} found.{' '}
                      <button onClick={openAdd} className="text-blue-600 underline">Add one</button>
                    </td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{item.address || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{item.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {tab === 'branches' && (
                          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 text-xs" onClick={() => openDoctors(item as Branch)}>
                            Doctors
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => openEdit(item)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
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
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editing ? 'Edit' : 'Add'} {tab === 'branches' ? 'Branch' : 'Hospital'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'name', label: 'Name *', type: 'text' },
                { key: 'address', label: 'Address', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'email', label: 'Email', type: 'email' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <Input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving || !form.name} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Doctors Modal */}
      {showDoctorsModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle>Doctors — {selectedBranch.name}</CardTitle>
              <CardDescription>Assign doctors and set per-branch consultation fee</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Assign Form */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                <select
                  className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={assignForm.doctor_id}
                  onChange={(e) => setAssignForm({ ...assignForm, doctor_id: e.target.value })}
                >
                  <option value="">Select doctor...</option>
                  {allDoctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Fee (EGP)"
                  value={assignForm.consultation_fee}
                  onChange={(e) => setAssignForm({ ...assignForm, consultation_fee: e.target.value })}
                />
                <Button onClick={handleAssign} disabled={!assignForm.doctor_id} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Assign
                </Button>
              </div>
              <Input
                placeholder="Schedule days e.g. SAT,MON,WED"
                value={assignForm.schedule_days}
                onChange={(e) => setAssignForm({ ...assignForm, schedule_days: e.target.value })}
                className="text-sm"
              />

              {/* Assigned Doctors */}
              <div className="space-y-2">
                {branchDoctors.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No doctors assigned yet.</p>
                ) : branchDoctors.map((bd: any) => {
                  const doc = allDoctors.find(d => d.id === bd.doctor_id);
                  return (
                    <div key={bd.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{doc ? `${doc.first_name} ${doc.last_name}` : `Doctor #${bd.doctor_id}`}</div>
                        <div className="text-xs text-gray-500">{doc?.specialization}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 text-sm">EGP {bd.consultation_fee}</div>
                        {bd.schedule_days && <div className="text-xs text-gray-500">{bd.schedule_days}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <div className="p-4 border-t">
              <Button variant="outline" onClick={() => setShowDoctorsModal(false)} className="w-full">Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
