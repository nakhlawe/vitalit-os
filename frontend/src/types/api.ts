// API Types for VITALIt Healthcare System
//
// These types model the FastAPI backend responses (snake_case) and also
// expose the camelCase display fields the UI components consume.

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'staff';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  isActive?: boolean;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  refresh_token?: string;
  requires_mfa?: boolean;
}

export type PatientGender = 'male' | 'female' | 'other';
export type PatientStatus = 'active' | 'inactive' | 'pending';

export interface Patient {
  id: number | string;
  patient_id: string;
  name: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: PatientGender;
  age: number;
  blood_group?: string | null;
  bloodType: string;
  address: string;
  phone: string;
  email: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  insurance_provider?: string | null;
  insurance_number?: string | null;
  allergies?: string | null;
  medical_history?: string | null;
  status: PatientStatus;
  doctor: string;
  lastVisit: string | Date | null;
  nextAppointment?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date | null;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: PatientGender;
  address: string;
  phone: string;
  email?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_number?: string;
  allergies?: string;
  medical_history?: string;
}

export type PatientUpdate = Partial<PatientCreate>;

export interface PatientSearchParams {
  search?: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  page?: number;
  limit?: number;
  skip?: number;
  [key: string]: unknown;
}

export type DoctorStatus = 'active' | 'inactive' | 'on_leave';

export interface Doctor {
  id: number | string;
  doctor_id: string;
  name: string;
  first_name: string;
  last_name: string;
  specialization: string;
  qualification: string;
  education: string;
  license_number: string;
  license: string;
  phone: string;
  email: string;
  address?: string | null;
  consultation_fee: number;
  is_active: boolean;
  department: string;
  status: DoctorStatus;
  experience: number;
  schedule: string;
  patients: number;
  created_at?: string | Date;
  updated_at?: string | Date | null;
}

export interface DoctorCreate {
  first_name: string;
  last_name: string;
  specialization: string;
  qualification: string;
  license_number: string;
  phone: string;
  email: string;
  address?: string;
  consultation_fee?: number;
  is_active?: boolean;
}

export type DoctorUpdate = Partial<DoctorCreate>;

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: number | string;
  appointment_id: string;
  patient_id: number;
  patientId: string;
  patientName: string;
  doctor_id: number;
  doctorId: string;
  doctorName: string;
  scheduled_datetime: string;
  date: string | Date;
  time: string;
  duration_minutes: number;
  duration: number;
  reason: string;
  type: string;
  status: AppointmentStatus;
  notes?: string | null;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date | null;
}

export interface AppointmentCreate {
  patient_id: number;
  doctor_id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  reason: string;
  notes?: string;
  status?: AppointmentStatus;
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  date?: string | Date;
  time?: string;
  type?: string;
  duration?: number;
}

export type AppointmentUpdate = Partial<AppointmentCreate>;

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';
export type BillDisplayStatus = PaymentStatus | 'overdue';

export interface BillItem {
  id?: number;
  bill_id?: number;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Bill {
  id: number | string;
  bill_id: string;
  patient_id: number;
  patientId: string;
  patientName: string;
  appointment_id?: number | null;
  bill_date: string | Date;
  due_date: string | Date;
  date: string | Date;
  dueDate: string | Date;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  status: BillDisplayStatus;
  notes?: string | null;
  description: string;
  bill_items: BillItem[];
  insuranceCoverage?: number;
  patientResponsibility?: number;
  created_at?: string | Date;
  updated_at?: string | Date | null;
}

export interface BillCreate {
  patient_id: number;
  appointment_id?: number;
  bill_date: string | Date;
  due_date: string | Date;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  notes?: string;
  bill_items: BillItem[];
  patientId?: string;
  patientName?: string;
  amount?: number;
  description?: string;
  dueDate?: string | Date;
}

export type BillUpdate = Partial<BillCreate>;

export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  visit_date: string;
  chief_complaint?: string;
  diagnosis: string;
  treatment_plan?: string;
  prescription_notes?: string;
  notes?: string;
  created_by?: number;
  created_at?: string | Date;
}

export interface MedicalRecordCreate {
  patient_id: number;
  doctor_id: number;
  visit_date: string;
  chief_complaint?: string;
  diagnosis: string;
  treatment_plan?: string;
  prescription_notes?: string;
  notes?: string;
  created_by?: number;
}

export type MedicalRecordUpdate = Partial<MedicalRecordCreate>;

export interface InventoryItem {
  id: number | string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  price: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  monthlyRevenue: number;
  activePatients: number;
  pendingAppointments: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface SystemStatus {
  database: string;
  apiServer: string;
  storage: string;
  backup: string;
  responseTime: string;
  uptime: string;
  activeSessions: number;
  dataSync: string;
}

export interface RealTimeData {
  notifications: Notification[];
  systemStatus: SystemStatus;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface AnalyticsData {
  patientGrowth: ChartData[];
  revenueTrends: ChartData[];
  departmentDistribution: ChartData[];
  genderDistribution: ChartData[];
  ageGroupDistribution: ChartData[];
}

// Form Types (camelCase shapes used by legacy UI)

export interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: PatientGender;
  bloodType: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string[];
  medications: string[];
  insurance: string;
  insuranceNumber: string;
  doctor: string;
}

export interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  experience: number;
  education: string;
  license: string;
  schedule: string;
}

export interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  date: Date;
  time: string;
  type: 'consultation' | 'examination' | 'surgery' | 'follow_up' | 'emergency';
  notes: string;
  duration: number;
}

export interface BillFormData {
  patientId: string;
  amount: number;
  description: string;
  insuranceCoverage: number;
  dueDate: Date;
}

// Filter Types
export interface PatientFilters {
  status?: string;
  doctor?: string;
  ageRange?: [number, number];
  gender?: string;
  bloodType?: string;
}

export interface AppointmentFilters {
  status?: string;
  doctor?: string;
  patient?: string;
  dateRange?: [Date, Date];
  type?: string;
}

export interface BillFilters {
  status?: string;
  patient?: string;
  dateRange?: [Date, Date];
  amountRange?: [number, number];
}

// Search Types
export interface SearchResult {
  type: 'patient' | 'doctor' | 'appointment' | 'bill';
  id: string;
  title: string;
  subtitle: string;
  data: any;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

// Real-time Types
export interface RealTimeUpdate {
  type: 'patient' | 'appointment' | 'bill' | 'notification';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

// Dashboard Widget Types
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stats' | 'table' | 'list';
  title: string;
  data: any;
  config?: any;
}
