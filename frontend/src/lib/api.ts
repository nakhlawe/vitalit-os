import axios from 'axios';
import { API_BASE_URL } from './constants';
import type {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  Bill,
  BillCreate,
  BillUpdate,
  DashboardStats,
  Doctor,
  DoctorCreate,
  DoctorUpdate,
  InventoryItem,
  LoginResponse,
  MedicalRecord,
  Patient,
  PatientCreate,
  PatientSearchParams,
  PatientUpdate,
  User,
} from '@/types/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function computeAge(dateOfBirth?: string | null): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function timeOf(datetime?: string | Date | null): string {
  if (!datetime) return '';
  const d = new Date(datetime);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function pick(data: Record<string, unknown> | undefined, fields: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!data) return out;
  for (const field of fields) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '') {
      out[field] = value;
    }
  }
  return out;
}

const PATIENT_FIELDS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
  'blood_group',
  'address',
  'phone',
  'email',
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
  'insurance_provider',
  'insurance_number',
  'allergies',
  'medical_history',
] as const;

const DOCTOR_FIELDS = [
  'first_name',
  'last_name',
  'specialization',
  'qualification',
  'license_number',
  'phone',
  'email',
  'address',
  'consultation_fee',
  'is_active',
] as const;

const APPOINTMENT_FIELDS = [
  'patient_id',
  'doctor_id',
  'scheduled_datetime',
  'duration_minutes',
  'reason',
  'status',
  'notes',
] as const;

const BILL_FIELDS = [
  'patient_id',
  'appointment_id',
  'bill_date',
  'due_date',
  'subtotal',
  'tax_amount',
  'discount_amount',
  'total_amount',
  'notes',
] as const;

const INVENTORY_FIELDS = [
  'name',
  'description',
  'category',
  'unit',
  'current_quantity',
  'minimum_quantity',
  'unit_price',
  'supplier',
  'location',
  'is_active',
] as const;

function mapPatient(raw: any): Patient {
  const fullName = [raw?.first_name, raw?.last_name].filter(Boolean).join(' ').trim();
  return {
    id: raw?.id,
    patient_id: raw?.patient_id ?? String(raw?.id ?? ''),
    name: fullName || raw?.name || '',
    first_name: raw?.first_name ?? '',
    last_name: raw?.last_name ?? '',
    date_of_birth: raw?.date_of_birth ?? '',
    gender: raw?.gender ?? 'other',
    age: raw?.age ?? computeAge(raw?.date_of_birth),
    blood_group: raw?.blood_group ?? raw?.blood_type ?? raw?.bloodType ?? null,
    bloodType: raw?.blood_type ?? raw?.bloodType ?? raw?.blood_group ?? '',
    address: raw?.address ?? '',
    phone: raw?.phone ?? '',
    email: raw?.email ?? '',
    emergency_contact_name: raw?.emergency_contact_name ?? null,
    emergency_contact_phone: raw?.emergency_contact_phone ?? null,
    emergency_contact_relationship: raw?.emergency_contact_relationship ?? null,
    insurance_provider: raw?.insurance_provider ?? null,
    insurance_number: raw?.insurance_number ?? null,
    allergies: raw?.allergies ?? null,
    medical_history: raw?.medical_history ?? null,
    status: raw?.status ?? 'active',
    doctor: raw?.doctor ?? raw?.doctor_name ?? raw?.doctorName ?? '',
    lastVisit: raw?.last_visit ?? raw?.lastVisit ?? null,
    nextAppointment: raw?.next_appointment ?? raw?.nextAppointment ?? null,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
}

function mapDoctor(raw: any): Doctor {
  const fullName = [raw?.first_name, raw?.last_name].filter(Boolean).join(' ').trim();
  return {
    id: raw?.id,
    doctor_id: raw?.doctor_id ?? String(raw?.id ?? ''),
    name: fullName || raw?.name || '',
    first_name: raw?.first_name ?? '',
    last_name: raw?.last_name ?? '',
    specialization: raw?.specialization ?? '',
    qualification: raw?.qualification ?? '',
    education: raw?.qualification ?? raw?.education ?? '',
    license_number: raw?.license_number ?? '',
    license: raw?.license_number ?? raw?.license ?? '',
    phone: raw?.phone ?? '',
    email: raw?.email ?? '',
    address: raw?.address ?? null,
    consultation_fee: raw?.consultation_fee ?? 0,
    is_active: raw?.is_active ?? true,
    department: raw?.department ?? raw?.specialization ?? '',
    status: raw?.status ?? (raw?.is_active === false ? 'inactive' : 'active'),
    experience: raw?.experience ?? 0,
    schedule: raw?.schedule ?? '',
    patients: raw?.patients ?? 0,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
}

function mapAppointment(raw: any): Appointment {
  return {
    id: raw?.id,
    appointment_id: raw?.appointment_id ?? String(raw?.id ?? ''),
    patient_id: raw?.patient_id,
    patientId: String(raw?.patient_id ?? ''),
    patientName: raw?.patient_name ?? '',
    doctor_id: raw?.doctor_id,
    doctorId: String(raw?.doctor_id ?? ''),
    doctorName: raw?.doctor_name ?? '',
    scheduled_datetime: raw?.scheduled_datetime ?? '',
    date: raw?.scheduled_datetime ?? '',
    time: timeOf(raw?.scheduled_datetime),
    duration_minutes: raw?.duration_minutes ?? 30,
    duration: raw?.duration_minutes ?? 30,
    reason: raw?.reason ?? '',
    type: raw?.reason ?? raw?.type ?? 'Consultation',
    status: raw?.status ?? 'scheduled',
    notes: raw?.notes ?? null,
    created_by: raw?.created_by,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
}

function mapBill(raw: any): Bill {
  const status: Bill['status'] =
    raw?.payment_status === 'pending' && raw?.due_date && new Date(raw.due_date) < new Date()
      ? 'overdue'
      : (raw?.payment_status ?? 'pending');
  return {
    id: raw?.id,
    bill_id: raw?.bill_id ?? String(raw?.id ?? ''),
    patient_id: raw?.patient_id,
    patientId: String(raw?.patient_id ?? ''),
    patientName: raw?.patient_name ?? '',
    appointment_id: raw?.appointment_id ?? null,
    bill_date: raw?.bill_date ?? '',
    due_date: raw?.due_date ?? '',
    date: raw?.bill_date ?? '',
    dueDate: raw?.due_date ?? '',
    subtotal: raw?.subtotal ?? 0,
    tax_amount: raw?.tax_amount ?? 0,
    discount_amount: raw?.discount_amount ?? 0,
    total_amount: raw?.total_amount ?? 0,
    amount: raw?.total_amount ?? 0,
    paid_amount: raw?.paid_amount ?? 0,
    payment_status: raw?.payment_status ?? 'pending',
    status,
    notes: raw?.notes ?? null,
    description: raw?.notes ?? '',
    bill_items: raw?.bill_items ?? [],
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
}

function mapInventoryItem(raw: any): InventoryItem {
  const quantity = raw?.quantity ?? raw?.current_quantity ?? 0;
  const minimumQuantity = raw?.minimum_quantity ?? 0;
  return {
    id: raw?.id,
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    category: raw?.category ?? '',
    quantity,
    current_quantity: quantity,
    minimum_quantity: minimumQuantity,
    unit: raw?.unit ?? '',
    price: raw?.price ?? raw?.unit_price ?? 0,
    unit_price: raw?.unit_price ?? raw?.price ?? 0,
    supplier: raw?.supplier ?? '',
    location: raw?.location ?? '',
    is_active: raw?.is_active ?? true,
    status: raw?.status ?? (quantity <= minimumQuantity ? 'Low Stock' : 'In Stock'),
    created_at: raw?.created_at ?? raw?.createdAt,
    updated_at: raw?.updated_at ?? raw?.updatedAt,
  };
}

export const authAPI = {
  login: async (data: { username: string; password: string }): Promise<LoginResponse> => {
    const form = new URLSearchParams();
    form.append('username', data.username);
    form.append('password', data.password);
    const { data: response } = await apiClient.post<LoginResponse>('/auth/login', form);
    return response;
  },
  register: async (data: Record<string, unknown>): Promise<User> => {
    const { data: response } = await apiClient.post<User>('/auth/register', data);
    return response;
  },
  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

export const patientsAPI = {
  getAll: async (params?: PatientSearchParams): Promise<Patient[]> => {
    const { data } = await apiClient.get('/patients/', { params });
    return (Array.isArray(data) ? data : []).map(mapPatient);
  },
  getById: async (id: number | string): Promise<Patient> => {
    const { data } = await apiClient.get(`/patients/${id}`);
    return mapPatient(data);
  },
  create: async (data: PatientCreate | Partial<Patient>): Promise<Patient> => {
    const { data: response } = await apiClient.post('/patients/', pick(data as Record<string, unknown>, PATIENT_FIELDS));
    return mapPatient(response);
  },
  update: async (id: number | string, data: PatientUpdate | Partial<Patient>): Promise<Patient> => {
    const { data: response } = await apiClient.put(`/patients/${id}`, pick(data as Record<string, unknown>, PATIENT_FIELDS));
    return mapPatient(response);
  },
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },
};

export const doctorsAPI = {
  getAll: async (params?: Record<string, unknown>): Promise<Doctor[]> => {
    const { data } = await apiClient.get('/doctors/', { params });
    return (Array.isArray(data) ? data : []).map(mapDoctor);
  },
  getById: async (id: number | string): Promise<Doctor> => {
    const { data } = await apiClient.get(`/doctors/${id}`);
    return mapDoctor(data);
  },
  create: async (data: DoctorCreate | Partial<Doctor>): Promise<Doctor> => {
    const { data: response } = await apiClient.post('/doctors/', pick(data as Record<string, unknown>, DOCTOR_FIELDS));
    return mapDoctor(response);
  },
  update: async (id: number | string, data: DoctorUpdate | Partial<Doctor>): Promise<Doctor> => {
    const { data: response } = await apiClient.put(`/doctors/${id}`, pick(data as Record<string, unknown>, DOCTOR_FIELDS));
    return mapDoctor(response);
  },
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/doctors/${id}`);
  },
};

export const appointmentsAPI = {
  getAll: async (params?: Record<string, unknown>): Promise<Appointment[]> => {
    const { data } = await apiClient.get('/appointments/', { params });
    return (Array.isArray(data) ? data : []).map(mapAppointment);
  },
  getById: async (id: number | string): Promise<Appointment> => {
    const { data } = await apiClient.get(`/appointments/${id}`);
    return mapAppointment(data);
  },
  create: async (data: AppointmentCreate | Partial<Appointment>): Promise<Appointment> => {
    const { data: response } = await apiClient.post('/appointments/', pick(data as Record<string, unknown>, APPOINTMENT_FIELDS));
    return mapAppointment(response);
  },
  update: async (id: number | string, data: AppointmentUpdate | Partial<Appointment>): Promise<Appointment> => {
    const { data: response } = await apiClient.put(`/appointments/${id}`, pick(data as Record<string, unknown>, APPOINTMENT_FIELDS));
    return mapAppointment(response);
  },
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },
};

export const billingAPI = {
  getAll: async (params?: Record<string, unknown>): Promise<Bill[]> => {
    const { data } = await apiClient.get('/billing/bills', { params });
    return (Array.isArray(data) ? data : []).map(mapBill);
  },
  getById: async (id: number | string): Promise<Bill> => {
    const { data } = await apiClient.get(`/billing/bills/${id}`);
    return mapBill(data);
  },
  create: async (data: BillCreate | Partial<Bill>): Promise<Bill> => {
    const payload = {
      ...pick(data as Record<string, unknown>, BILL_FIELDS),
      bill_items: (data as BillCreate)?.bill_items ?? [],
    };
    const { data: response } = await apiClient.post('/billing/bills', payload);
    return mapBill(response);
  },
  update: async (id: number | string, data: BillUpdate | Partial<Bill>): Promise<Bill> => {
    const { data: response } = await apiClient.put(`/billing/bills/${id}`, pick(data as Record<string, unknown>, BILL_FIELDS));
    return mapBill(response);
  },
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/billing/bills/${id}`);
  },
};

const INVENTORY_STORAGE_KEY = 'vitalit_inventory';

function loadLocalInventory(): InventoryItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as any[]).map(mapInventoryItem) : [];
  } catch {
    return [];
  }
}

function saveLocalInventory(items: InventoryItem[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // ignore storage write failures
  }
}

export const inventoryAPI = {
  getAll: async (): Promise<InventoryItem[]> => {
    return loadLocalInventory();
  },
  create: async (data: Record<string, unknown>): Promise<InventoryItem> => {
    const items = loadLocalInventory();
    const item: InventoryItem = {
      id: Date.now(),
      name: (data.name as string) || '',
      description: (data.description as string) || '',
      category: (data.category as string) || '',
      quantity: Number(data.current_quantity ?? data.quantity ?? 0),
      current_quantity: Number(data.current_quantity ?? data.quantity ?? 0),
      minimum_quantity: Number(data.minimum_quantity ?? 0),
      unit: (data.unit as string) || '',
      price: Number(data.unit_price ?? data.price ?? 0),
      unit_price: Number(data.unit_price ?? data.price ?? 0),
      supplier: (data.supplier as string) || '',
      location: (data.location as string) || '',
      is_active: Boolean(data.is_active ?? true),
      status: 'In Stock',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalInventory([...items, item]);
    return mapInventoryItem(item);
  },
  update: async (id: number | string, data: Record<string, unknown>): Promise<InventoryItem> => {
    const items = loadLocalInventory();
    const next = items.map((item) =>
      item.id === id
        ? {
            ...item,
            ...pick(data, INVENTORY_FIELDS),
            quantity: Number(data.current_quantity ?? item.quantity),
            current_quantity: Number(data.current_quantity ?? item.current_quantity),
            updated_at: new Date().toISOString(),
          }
        : item,
    );
    saveLocalInventory(next);
    return next.find((item) => item.id === id) as InventoryItem;
  },
  delete: async (id: number | string): Promise<void> => {
    saveLocalInventory(loadLocalInventory().filter((item) => item.id !== id));
  },
};

const RECORDS_STORAGE_KEY = 'vitalit_records';

function loadLocalRecords(): MedicalRecord[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MedicalRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: MedicalRecord[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    }
  } catch {
    // ignore storage write failures
  }
}

export const recordsAPI = {
  getAll: async (): Promise<MedicalRecord[]> => loadLocalRecords(),
  getById: async (id: number | string): Promise<MedicalRecord> => {
    const record = loadLocalRecords().find((r) => r.id === id);
    if (!record) throw new Error('Medical record not found');
    return record;
  },
  create: async (data: Record<string, unknown>): Promise<MedicalRecord> => {
    const records = loadLocalRecords();
    const record: MedicalRecord = {
      id: Date.now(),
      patient_id: Number(data.patient_id ?? 0),
      doctor_id: Number(data.doctor_id ?? 0),
      visit_date: (data.visit_date as string) || new Date().toISOString().slice(0, 10),
      chief_complaint: (data.chief_complaint as string) || '',
      diagnosis: (data.diagnosis as string) || '',
      treatment_plan: (data.treatment_plan as string) || '',
      prescription_notes: (data.prescription_notes as string) || '',
      notes: (data.notes as string) || '',
      created_by: Number(data.created_by ?? 1),
      created_at: new Date().toISOString(),
    };
    saveLocalRecords([record, ...records]);
    return record;
  },
  update: async (id: number | string, data: Record<string, unknown>): Promise<MedicalRecord> => {
    const records = loadLocalRecords();
    const next = records.map((r) => (r.id === id ? { ...r, ...(data as Partial<MedicalRecord>) } : r));
    saveLocalRecords(next);
    return next.find((r) => r.id === id) as MedicalRecord;
  },
  delete: async (id: number | string): Promise<void> => {
    saveLocalRecords(loadLocalRecords().filter((r) => r.id !== id));
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data as DashboardStats;
  },
  getStatsDev: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats/dev');
    return data as DashboardStats;
  },
};

export const analyticsAPI = {
  getPatientGrowth: async () => [
    { label: 'Jan', value: 180, color: '#0A84FF' },
    { label: 'Feb', value: 210, color: '#0A84FF' },
    { label: 'Mar', value: 250, color: '#0A84FF' },
    { label: 'Apr', value: 230, color: '#0A84FF' },
    { label: 'May', value: 290, color: '#0A84FF' },
    { label: 'Jun', value: 320, color: '#0A84FF' },
    { label: 'Jul', value: 360, color: '#0A84FF' },
    { label: 'Aug', value: 400, color: '#0A84FF' },
    { label: 'Sep', value: 380, color: '#0A84FF' },
    { label: 'Oct', value: 430, color: '#0A84FF' },
    { label: 'Nov', value: 470, color: '#0A84FF' },
    { label: 'Dec', value: 520, color: '#0A84FF' },
  ],
  getRevenueTrends: async () => [
    { label: 'Jan', value: 42000, color: '#34C759' },
    { label: 'Feb', value: 48000, color: '#34C759' },
    { label: 'Mar', value: 45000, color: '#34C759' },
    { label: 'Apr', value: 51000, color: '#34C759' },
    { label: 'May', value: 56000, color: '#34C759' },
    { label: 'Jun', value: 60000, color: '#34C759' },
    { label: 'Jul', value: 58000, color: '#34C759' },
    { label: 'Aug', value: 64000, color: '#34C759' },
    { label: 'Sep', value: 70000, color: '#34C759' },
    { label: 'Oct', value: 68000, color: '#34C759' },
    { label: 'Nov', value: 75000, color: '#34C759' },
    { label: 'Dec', value: 82000, color: '#34C759' },
  ],
  getDepartmentDistribution: async () => [
    { label: 'Cardiology', value: 340, color: '#0A84FF' },
    { label: 'Neurology', value: 250, color: '#34C759' },
    { label: 'Pediatrics', value: 310, color: '#FF9F0A' },
    { label: 'Orthopedics', value: 180, color: '#FF375F' },
    { label: 'General', value: 420, color: '#5856D6' },
  ],
  getGenderDistribution: async () => [
    { label: 'Male', value: 640, color: '#0A84FF' },
    { label: 'Female', value: 580, color: '#FF375F' },
    { label: 'Other', value: 27, color: '#5856D6' },
  ],
  getAgeGroupDistribution: async () => [
    { label: '0-12', value: 150, color: '#34C759' },
    { label: '13-18', value: 120, color: '#0A84FF' },
    { label: '19-35', value: 340, color: '#FF9F0A' },
    { label: '36-55', value: 420, color: '#FF375F' },
    { label: '56+', value: 230, color: '#5856D6' },
  ],
};

export default apiClient;
