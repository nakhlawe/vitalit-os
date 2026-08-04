from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OperationBase(BaseModel):
    patient_id: int
    doctor_id: int
    hospital_id: int
    operation_type: str = Field(..., min_length=1, max_length=200)
    scheduled_datetime: datetime
    duration_estimated_minutes: Optional[int] = Field(60, ge=1)
    pre_op_notes: Optional[str] = None
    notes: Optional[str] = None


class OperationCreate(OperationBase):
    pass


class OperationUpdate(BaseModel):
    hospital_id: Optional[int] = None
    operation_type: Optional[str] = Field(None, min_length=1, max_length=200)
    scheduled_datetime: Optional[datetime] = None
    duration_estimated_minutes: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, pattern="^(scheduled|confirmed|in_progress|completed|cancelled|postponed)$")
    pre_op_notes: Optional[str] = None
    post_op_notes: Optional[str] = None
    notes: Optional[str] = None


class Operation(OperationBase):
    id: int
    operation_id: str
    status: str = "scheduled"
    post_op_notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True
