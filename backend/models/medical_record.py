from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(30), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("examination_templates.id"), nullable=True)
    visit_date = Column(Date, nullable=False, index=True)
    chief_complaint = Column(Text)
    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    prescription_notes = Column(Text)
    notes = Column(Text)
    # Stores the doctor's filled answers for the chosen template sections
    template_data = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient")
    doctor = relationship("Doctor")
    branch = relationship("Branch")
    template = relationship("ExaminationTemplate", back_populates="records")

    __table_args__ = (
        Index('idx_record_patient', 'patient_id'),
        Index('idx_record_doctor', 'doctor_id'),
        Index('idx_record_branch', 'branch_id'),
        Index('idx_record_visit_date', 'visit_date'),
    )