from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.core import database
from backend.core import security as auth
from backend import audit
import secrets
from datetime import datetime

router = APIRouter(prefix="/operations", tags=["Operations"])


def _gen_operation_id() -> str:
    return f"OP{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"


@router.post("/", response_model=schemas.Operation, status_code=201)
async def create_operation(
    data: schemas.OperationCreate,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    patient = db.query(models.Patient).filter(models.Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    doctor = db.query(models.Doctor).filter(models.Doctor.id == data.doctor_id, models.Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found or inactive")
    hospital = db.query(models.Hospital).filter(models.Hospital.id == data.hospital_id, models.Hospital.is_active == True).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found or inactive")

    op = models.Operation(
        operation_id=_gen_operation_id(),
        created_by=current_user.id if current_user else None,
        **data.model_dump(),
    )
    db.add(op)
    db.commit()
    db.refresh(op)
    audit.AuditLogger.log_create(db, current_user.id, "operations", op.id, data.model_dump(), request)
    return op


@router.get("/", response_model=List[schemas.Operation])
async def list_operations(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = Query(None),
    doctor_id: Optional[int] = Query(None),
    hospital_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Operation)
    if patient_id:
        q = q.filter(models.Operation.patient_id == patient_id)
    if doctor_id:
        q = q.filter(models.Operation.doctor_id == doctor_id)
    if hospital_id:
        q = q.filter(models.Operation.hospital_id == hospital_id)
    if status:
        q = q.filter(models.Operation.status == status)
    return q.order_by(models.Operation.scheduled_datetime.desc()).offset(skip).limit(limit).all()


@router.get("/{operation_id}", response_model=schemas.Operation)
async def get_operation(
    operation_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    op = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")
    return op


@router.put("/{operation_id}", response_model=schemas.Operation)
async def update_operation(
    operation_id: int,
    data: schemas.OperationUpdate,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    op = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")
    old = data.model_dump()
    update = data.model_dump(exclude_unset=True)
    for k, v in update.items():
        setattr(op, k, v)
    db.commit()
    db.refresh(op)
    audit.AuditLogger.log_update(db, current_user.id, "operations", op.id, old, update, request)
    return op


@router.delete("/{operation_id}")
async def delete_operation(
    operation_id: int,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    op = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")
    audit.AuditLogger.log_delete(db, current_user.id, "operations", op.id, {"operation_id": op.operation_id}, request)
    db.delete(op)
    db.commit()
    return {"message": "Operation deleted"}
