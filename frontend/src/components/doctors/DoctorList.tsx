"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Doctor, DoctorCreate, DoctorUpdate } from '@/types/api';
import { doctorsAPI } from '@/lib/api';
import DoctorForm from '@/components/forms/DoctorForm';
import toast from 'react-hot-toast';

interface DoctorListProps {
  doctors?: Doctor[];
  onDoctorsChange?: () => void;
}

export default function DoctorList({ doctors: initialDoctors, onDoctorsChange }: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors || []);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (!initialDoctors) {
      fetchDoctors();
    } else {
      setDoctors(initialDoctors);
    }
  }, [initialDoctors]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorsAPI.getAll();
      setDoctors(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (doctorData: DoctorCreate | DoctorUpdate) => {
    try {
      if (editingDoctor) {
        const updatedDoctor = await doctorsAPI.update(editingDoctor.id, doctorData as DoctorUpdate);
        setDoctors(prev => prev.map(d => d.id === editingDoctor.id ? updatedDoctor : d));
        setShowEditForm(false);
        setEditingDoctor(null);
        toast.success('Doctor updated successfully');
      } else {
        const newDoctor = await doctorsAPI.create(doctorData as DoctorCreate);
        setDoctors(prev => [...prev, newDoctor]);
        setShowAddForm(false);
        toast.success('Doctor added successfully');
      }
      if (onDoctorsChange) onDoctorsChange();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save doctor');
    }
  };

  const handleDeleteDoctor = async (doctorId: number | string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    
    try {
      await doctorsAPI.delete(doctorId);
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      toast.success('Doctor deleted successfully');
      if (onDoctorsChange) onDoctorsChange();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete doctor');
    }
  };

  const openEditForm = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowEditForm(true);
  };

  const openAddForm = () => {
    setShowAddForm(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Doctors</CardTitle>
          <Button 
            className="flex items-center gap-2"
            onClick={openAddForm}
          >
            <span>➕</span> Add Doctor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && doctors.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'first_name', header: 'Name', render: (d) => `${d.first_name} ${d.last_name}` },
              { key: 'specialization', header: 'Specialization' },
              { key: 'phone', header: 'Phone' },
              { key: 'email', header: 'Email' },
              {
                key: 'is_active',
                header: 'Status',
                render: (d) => (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    d.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (d) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(d)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDoctor(d.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={doctors}
            rowKey={(d) => d.id}
            emptyMessage="No doctors found."
          />
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
          </DialogHeader>
          <DoctorForm 
            onDoctorAdded={handleCreateOrUpdate}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
          </DialogHeader>
          {editingDoctor && (
            <DoctorForm 
              doctor={editingDoctor}
              onDoctorAdded={handleCreateOrUpdate}
              onCancel={() => setShowEditForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
