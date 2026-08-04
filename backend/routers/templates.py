from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.core import database
from backend.core import security as auth
from backend import audit
import secrets
from datetime import datetime

router = APIRouter(prefix="/templates", tags=["Examination Templates"])


def _gen_template_id() -> str:
    return f"T{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"


@router.post("/", response_model=schemas.ExaminationTemplate, status_code=201)
async def create_template(
    data: schemas.ExaminationTemplateCreate,
    current_user: models.User = Depends(auth.require_doctor),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    template = models.ExaminationTemplate(
        template_id=_gen_template_id(),
        created_by=current_user.id if current_user else None,
        **data.model_dump(),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    audit.AuditLogger.log_create(db, current_user.id, "examination_templates", template.id, data.model_dump(), request)
    return template


@router.get("/", response_model=List[schemas.ExaminationTemplate])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    specialty: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    q = db.query(models.ExaminationTemplate)
    if active_only:
        q = q.filter(models.ExaminationTemplate.is_active == True)
    if specialty:
        q = q.filter(models.ExaminationTemplate.specialty.ilike(f"%{specialty}%"))
    return q.order_by(models.ExaminationTemplate.name).offset(skip).limit(limit).all()


@router.get("/{template_id}", response_model=schemas.ExaminationTemplate)
async def get_template(
    template_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    t = db.query(models.ExaminationTemplate).filter(models.ExaminationTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t


@router.put("/{template_id}", response_model=schemas.ExaminationTemplate)
async def update_template(
    template_id: int,
    data: schemas.ExaminationTemplateUpdate,
    current_user: models.User = Depends(auth.require_doctor),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    t = db.query(models.ExaminationTemplate).filter(models.ExaminationTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    old = data.model_dump()
    update = data.model_dump(exclude_unset=True)
    for k, v in update.items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    audit.AuditLogger.log_update(db, current_user.id, "examination_templates", t.id, old, update, request)
    return t


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    t = db.query(models.ExaminationTemplate).filter(models.ExaminationTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    audit.AuditLogger.log_delete(db, current_user.id, "examination_templates", t.id, {"name": t.name}, request)
    db.delete(t)
    db.commit()
    return {"message": "Template deleted"}
