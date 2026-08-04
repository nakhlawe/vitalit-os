from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.core import database
from backend.core import security as auth
from backend import audit
import secrets
from datetime import datetime

router = APIRouter(prefix="/triage", tags=["Triage"])


def _gen_triage_id() -> str:
    return f"TR{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"


@router.post("/", response_model=schemas.TriageRecord, status_code=201)
async def create_triage(
    data: schemas.TriageRecordCreate,
    current_user: models.User = Depends(auth.require_nurse),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    patient = db.query(models.Patient).filter(models.Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if data.appointment_id:
        appt = db.query(models.Appointment).filter(models.Appointment.id == data.appointment_id).first()
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")

    record = models.TriageRecord(
        triage_id=_gen_triage_id(),
        assessed_by=current_user.id if current_user else None,
        **data.model_dump(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    audit.AuditLogger.log_create(db, current_user.id, "triage_records", record.id, data.model_dump(), request)
    return record


@router.get("/", response_model=List[schemas.TriageRecord])
async def list_triage_records(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = Query(None),
    appointment_id: Optional[int] = Query(None),
    branch_id: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.require_nurse),
    db: Session = Depends(database.get_db),
):
    q = db.query(models.TriageRecord)
    if patient_id:
        q = q.filter(models.TriageRecord.patient_id == patient_id)
    if appointment_id:
        q = q.filter(models.TriageRecord.appointment_id == appointment_id)
    if branch_id:
        q = q.filter(models.TriageRecord.branch_id == branch_id)
    if priority:
        q = q.filter(models.TriageRecord.priority == priority)
    return q.order_by(models.TriageRecord.assessed_at.desc()).offset(skip).limit(limit).all()


@router.get("/{triage_id}", response_model=schemas.TriageRecord)
async def get_triage_record(
    triage_id: int,
    current_user: models.User = Depends(auth.require_nurse),
    db: Session = Depends(database.get_db),
):
    record = db.query(models.TriageRecord).filter(models.TriageRecord.id == triage_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Triage record not found")
    return record


@router.put("/{triage_id}", response_model=schemas.TriageRecord)
async def update_triage_record(
    triage_id: int,
    data: schemas.TriageRecordUpdate,
    current_user: models.User = Depends(auth.require_nurse),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    record = db.query(models.TriageRecord).filter(models.TriageRecord.id == triage_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Triage record not found")
    old = data.model_dump()
    update = data.model_dump(exclude_unset=True)
    for k, v in update.items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    audit.AuditLogger.log_update(db, current_user.id, "triage_records", record.id, old, update, request)
    return record


@router.delete("/{triage_id}")
async def delete_triage_record(
    triage_id: int,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    record = db.query(models.TriageRecord).filter(models.TriageRecord.id == triage_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Triage record not found")
    audit.AuditLogger.log_delete(db, current_user.id, "triage_records", record.id, {"triage_id": record.triage_id}, request)
    db.delete(record)
    db.commit()
    return {"message": "Triage record deleted"}
