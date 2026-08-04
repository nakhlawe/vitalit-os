from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class TriageRecordBase(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    branch_id: Optional[int] = None
    vital_signs: Optional[Dict[str, Any]] = None
    chief_complaint: Optional[str] = None
    triage_notes: Optional[str] = None
    priority: Optional[str] = Field("normal", pattern="^(urgent|high|normal|low)$")


class TriageRecordCreate(TriageRecordBase):
    pass


class TriageRecordUpdate(BaseModel):
    vital_signs: Optional[Dict[str, Any]] = None
    chief_complaint: Optional[str] = None
    triage_notes: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(urgent|high|normal|low)$")


class TriageRecord(TriageRecordBase):
    id: int
    triage_id: str
    assessed_by: Optional[int] = None
    assessed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
