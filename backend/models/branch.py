from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base


class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    doctor_branches = relationship("DoctorBranch", back_populates="branch")
    appointments = relationship("Appointment", back_populates="branch")
    triage_records = relationship("TriageRecord", back_populates="branch")

    __table_args__ = (
        Index("idx_branch_name", "name"),
    )


class DoctorBranch(Base):
    """Per-branch doctor assignment with individual consultation fee."""
    __tablename__ = "doctor_branches"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    consultation_fee = Column(Float, default=0.0)
    schedule_days = Column(String(50))   # e.g. "SAT,MON,WED"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="doctor_branches")
    branch = relationship("Branch", back_populates="doctor_branches")

    __table_args__ = (
        UniqueConstraint("doctor_id", "branch_id", name="uq_doctor_branch"),
        Index("idx_doctor_branch_doctor", "doctor_id"),
        Index("idx_doctor_branch_branch", "branch_id"),
    )


class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    operations = relationship("Operation", back_populates="hospital")

    __table_args__ = (
        Index("idx_hospital_name", "name"),
    )
