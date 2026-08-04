from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base


class ExaminationTemplate(Base):
    """Reusable examination form templates that doctors can fill and customise per visit."""
    __tablename__ = "examination_templates"
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    specialty = Column(String(100), index=True)
    description = Column(Text)
    # sections is a JSON list:
    # [{"title": "Vital Signs", "fields": [{"label": "BP", "type": "text", "required": true}, ...]}, ...]
    sections = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by_user = relationship("User")
    records = relationship("MedicalRecord", back_populates="template")

    __table_args__ = (
        Index("idx_template_specialty", "specialty"),
        Index("idx_template_name", "name"),
    )
