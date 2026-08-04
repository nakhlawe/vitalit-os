import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base


class OperationStatusEnum(enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class Operation(Base):
    __tablename__ = "operations"
    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(String(30), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    operation_type = Column(String(200), nullable=False)
    scheduled_datetime = Column(DateTime, nullable=False)
    duration_estimated_minutes = Column(Integer, default=60)
    status = Column(Enum(OperationStatusEnum), default=OperationStatusEnum.SCHEDULED, nullable=False)
    pre_op_notes = Column(Text)
    post_op_notes = Column(Text)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient")
    doctor = relationship("Doctor")
    hospital = relationship("Hospital", back_populates="operations")
    created_by_user = relationship("User")

    __table_args__ = (
        Index("idx_operation_datetime", "scheduled_datetime"),
        Index("idx_operation_status", "status"),
        Index("idx_operation_patient", "patient_id"),
        Index("idx_operation_doctor", "doctor_id"),
        Index("idx_operation_hospital", "hospital_id"),
    )
