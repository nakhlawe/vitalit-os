from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    visit_date: date
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    prescription_notes: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordUpdate(BaseModel):
    doctor_id: Optional[int] = None
    visit_date: Optional[date] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    prescription_notes: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecord(MedicalRecordBase):
    id: int
    record_id: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True