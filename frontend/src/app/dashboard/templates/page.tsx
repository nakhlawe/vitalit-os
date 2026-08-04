'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { templatesAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'textarea';

type TemplateField = {
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  placeholder?: string;
};

type TemplateSection = {
  title: string;
  fields: TemplateField[];
};

type Template = {
  id: number;
  template_id: string;
  name: string;
  specialty?: string;
  description?: string;
  sections: TemplateSection[];
  is_active: boolean;
};

const FIELD_TYPES: FieldType[] = ['text', 'number', 'select', 'checkbox', 'textarea'];

const newField = (): TemplateField => ({ label: '', type: 'text', required: false, placeholder: '' });
const newSection = (): TemplateSection => ({ title: '', fields: [newField()] });

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [sections, setSections] = useState<TemplateSection[]>([newSection()]);
  const [saving, setSaving] = useState(false);

  // Preview form state
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const data = await templatesAPI.getAll({ active_only: false });
      setTemplates(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = templates.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.specialty ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormSpecialty('');
    setFormDescription('');
    setSections([newSection()]);
    setShowForm(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setFormName(t.name);
    setFormSpecialty(t.specialty ?? '');
    setFormDescription(t.description ?? '');
    setSections(t.sections.length ? JSON.parse(JSON.stringify(t.sections)) : [newSection()]);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { name: formName, specialty: formSpecialty || null, description: formDescription || null, sections };
      if (editing) await templatesAPI.update(editing.id, payload);
      else await templatesAPI.create(payload);
      setShowForm(false);
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    await templatesAPI.delete(id);
    await fetchAll();
  };

  const toggleActive = async (t: Template) => {
    await templatesAPI.update(t.id, { is_active: !t.is_active });
    await fetchAll();
  };

  // Section/Field helpers
  const addSection = () => setSections([...sections, newSection()]);
  const removeSection = (si: number) => setSections(sections.filter((_, i) => i !== si));
  const updateSection = (si: number, key: keyof TemplateSection, value: any) => {
    setSections(sections.map((s, i) => i === si ? { ...s, [key]: value } : s));
  };

  const addField = (si: number) => {
    setSections(sections.map((s, i) => i === si ? { ...s, fields: [...s.fields, newField()] } : s));
  };
  const removeField = (si: number, fi: number) => {
    setSections(sections.map((s, i) => i === si ? { ...s, fields: s.fields.filter((_, j) => j !== fi) } : s));
  };
  const updateField = (si: number, fi: number, key: keyof TemplateField, value: any) => {
    setSections(sections.map((s, i) => i === si ? {
      ...s,
      fields: s.fields.map((f, j) => j === fi ? { ...f, [key]: value } : f)
    } : s));
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Examination Templates</h1>
          <p className="text-gray-600 mt-1">Create reusable examination forms for different specialties</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template List */}
        <div className="lg:col-span-1 space-y-4">
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500 text-sm">
                  No templates found. <button onClick={openAdd} className="text-blue-600 underline">Create one</button>
                </CardContent>
              </Card>
            ) : filtered.map((t) => (
              <Card
                key={t.id}
                className={cn('cursor-pointer transition-all hover:shadow-md', selectedTemplate?.id === t.id ? 'border-blue-500 shadow-md' : '')}
                onClick={() => { setSelectedTemplate(t); setPreviewData({}); }}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{t.name}</div>
                      {t.specialty && <div className="text-xs text-blue-600 mt-0.5">{t.specialty}</div>}
                      <div className="text-xs text-gray-500 mt-1">{t.sections.length} sections · {t.sections.reduce((n, s) => n + s.fields.length, 0)} fields</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                        {t.is_active ? 'Active' : 'Off'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); toggleActive(t); }}>
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          {!selectedTemplate ? (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <p className="text-sm">Select a template to preview</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    {selectedTemplate.specialty && <CardDescription className="text-blue-600 font-medium">{selectedTemplate.specialty}</CardDescription>}
                    {selectedTemplate.description && <CardDescription className="mt-1">{selectedTemplate.description}</CardDescription>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(selectedTemplate)}>Edit Template</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTemplate.sections.map((section, si) => (
                  <div key={si} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{section.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((field, fi) => {
                        const key = `${si}-${fi}`;
                        return (
                          <div key={fi} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.type === 'text' && (
                              <Input placeholder={field.placeholder} value={previewData[key] ?? ''} onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })} />
                            )}
                            {field.type === 'number' && (
                              <Input type="number" placeholder={field.placeholder} value={previewData[key] ?? ''} onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })} />
                            )}
                            {field.type === 'textarea' && (
                              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" rows={3} placeholder={field.placeholder} value={previewData[key] ?? ''} onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })} />
                            )}
                            {field.type === 'select' && (
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={previewData[key] ?? ''} onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })}>
                                <option value="">Choose...</option>
                                {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            )}
                            {field.type === 'checkbox' && (
                              <div className="flex items-center gap-2 mt-1">
                                <input type="checkbox" className="rounded border-gray-300" checked={!!previewData[key]} onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.checked })} />
                                <span className="text-sm text-gray-600">{field.placeholder || 'Yes'}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Examination</Button>
                  <Button variant="outline" onClick={() => setPreviewData({})}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Builder Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit' : 'Create'} Template</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Cardiology Initial Assessment" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <Input value={formSpecialty} onChange={(e) => setFormSpecialty(e.target.value)} placeholder="e.g. Cardiology" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description..." />
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Sections</h3>
                  <Button variant="outline" size="sm" onClick={addSection}>+ Add Section</Button>
                </div>
                {sections.map((section, si) => (
                  <div key={si} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        placeholder="Section title e.g. Vital Signs"
                        value={section.title}
                        onChange={(e) => updateSection(si, 'title', e.target.value)}
                      />
                      {sections.length > 1 && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => removeSection(si)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    {section.fields.map((field, fi) => (
                      <div key={fi} className="grid grid-cols-12 gap-2 items-start pl-4 border-l-2 border-gray-100">
                        <div className="col-span-4">
                          <Input placeholder="Field label" value={field.label} onChange={(e) => updateField(si, fi, 'label', e.target.value)} className="text-sm" />
                        </div>
                        <div className="col-span-3">
                          <select
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                            value={field.type}
                            onChange={(e) => updateField(si, fi, 'type', e.target.value as FieldType)}
                          >
                            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder={field.type === 'select' ? 'opt1,opt2' : 'Placeholder'}
                            value={field.type === 'select' ? (field.options ?? []).join(',') : (field.placeholder ?? '')}
                            onChange={(e) => {
                              if (field.type === 'select') updateField(si, fi, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean));
                              else updateField(si, fi, 'placeholder', e.target.value);
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center pt-2">
                          <input type="checkbox" title="Required" checked={field.required} onChange={(e) => updateField(si, fi, 'required', e.target.checked)} className="rounded border-gray-300" />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {section.fields.length > 1 && (
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-8 w-8 p-0" onClick={() => removeField(si, fi)}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs ml-4" onClick={() => addField(si)}>
                      + Add Field
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button onClick={handleSave} disabled={saving || !formName} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <LoadingSpinner size="sm" /> : 'Save Template'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
