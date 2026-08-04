from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── Branch ───────────────────────────────────────────────

class BranchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = True


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class Branch(BranchBase):
    id: int
    branch_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── DoctorBranch ─────────────────────────────────────────

class DoctorBranchBase(BaseModel):
    doctor_id: int
    branch_id: int
    consultation_fee: float = Field(0.0, ge=0)
    schedule_days: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = True


class DoctorBranchCreate(DoctorBranchBase):
    pass


class DoctorBranchUpdate(BaseModel):
    consultation_fee: Optional[float] = Field(None, ge=0)
    schedule_days: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class DoctorBranch(DoctorBranchBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Hospital ─────────────────────────────────────────────

class HospitalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = True


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class Hospital(HospitalBase):
    id: int
    hospital_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
