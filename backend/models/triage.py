from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base


class TriageRecord(Base):
    """Assessment done by the assistant doctor / nurse before the patient sees the main doctor."""
    __tablename__ = "triage_records"
    id = Column(Integer, primary_key=True, index=True)
    triage_id = Column(String(30), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    # vital_signs: {"bp": "120/80", "pulse": 78, "temp": 37.0, "weight": 75, "height": 175, "spo2": 98}
    vital_signs = Column(JSON)
    chief_complaint = Column(Text)
    triage_notes = Column(Text)
    # priority: urgent | high | normal | low
    priority = Column(String(20), default="normal", index=True)
    assessed_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    appointment = relationship("Appointment")
    branch = relationship("Branch", back_populates="triage_records")
    assessed_by_user = relationship("User")

    __table_args__ = (
        Index("idx_triage_patient", "patient_id"),
        Index("idx_triage_appointment", "appointment_id"),
        Index("idx_triage_branch", "branch_id"),
        Index("idx_triage_priority", "priority"),
        Index("idx_triage_assessed_at", "assessed_at"),
    )
