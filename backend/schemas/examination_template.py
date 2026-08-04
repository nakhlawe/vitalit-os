from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TemplateField(BaseModel):
    label: str
    type: str = "text"   # text | number | select | checkbox | textarea
    options: Optional[List[str]] = None   # for select fields
    required: bool = False
    placeholder: Optional[str] = None


class TemplateSection(BaseModel):
    title: str
    fields: List[TemplateField]


class ExaminationTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    specialty: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    sections: List[Dict[str, Any]] = Field(default_factory=list)
    is_active: Optional[bool] = True


class ExaminationTemplateCreate(ExaminationTemplateBase):
    pass


class ExaminationTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    specialty: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None


class ExaminationTemplate(ExaminationTemplateBase):
    id: int
    template_id: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
