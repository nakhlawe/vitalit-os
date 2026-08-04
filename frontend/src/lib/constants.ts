export const ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PATIENTS: '/dashboard/patients',
  DOCTORS: '/dashboard/doctors',
  APPOINTMENTS: '/dashboard/appointments',
  BILLING: '/dashboard/billing',
  RECORDS: '/dashboard/records',
  INVENTORY: '/dashboard/inventory',
  ANALYTICS: '/dashboard/analytics',
  SYSTEM: '/dashboard/system',
  BRANCHES: '/dashboard/branches',
  OPERATIONS: '/dashboard/operations',
  TEMPLATES: '/dashboard/templates',
  TRIAGE: '/dashboard/triage',
} as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
