from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend import models, schemas
from backend.core import database
from backend.core import security as auth
from backend import audit
from backend.core.security import generate_record_id

router = APIRouter(prefix="/records", tags=["Records"])


@router.post("/", response_model=schemas.MedicalRecord, status_code=201)
async def create_medical_record(
    record_data: schemas.MedicalRecordCreate,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    """Create a new medical record for a patient."""
    patient = db.query(models.Patient).filter(
        models.Patient.id == record_data.patient_id
    ).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    if record_data.doctor_id:
        doctor = db.query(models.Doctor).filter(
            models.Doctor.id == record_data.doctor_id,
            models.Doctor.is_active == True,
        ).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found or inactive"
            )

    record_id = generate_record_id()

    db_record = models.MedicalRecord(
        record_id=record_id,
        created_by=current_user.id if current_user else None,
        **record_data.model_dump(),
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    try:
        if current_user:
            audit.AuditLogger.log_create(
                db, current_user.id, "medical_records", db_record.id,
                record_data.model_dump(), request
            )
    except Exception as e:
        db.rollback()
        print(f"Audit logging failed: {e}")

    return db_record


@router.get("/", response_model=List[schemas.MedicalRecord])
async def get_medical_records(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    doctor_id: Optional[int] = Query(None, description="Filter by doctor ID"),
    search: Optional[str] = Query(None, description="Search by diagnosis or chief complaint"),
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    """Get medical records with optional filtering."""
    query = db.query(models.MedicalRecord)

    if patient_id:
        query = query.filter(models.MedicalRecord.patient_id == patient_id)

    if doctor_id:
        query = query.filter(models.MedicalRecord.doctor_id == doctor_id)

    if search:
        query = query.filter(
            or_(
                models.MedicalRecord.diagnosis.ilike(f"%{search}%"),
                models.MedicalRecord.chief_complaint.ilike(f"%{search}%"),
                models.MedicalRecord.treatment_plan.ilike(f"%{search}%"),
            )
        )

    records = query.order_by(
        models.MedicalRecord.visit_date.desc(),
        models.MedicalRecord.created_at.desc(),
    ).offset(skip).limit(limit).all()

    return records


@router.get("/{record_id}", response_model=schemas.MedicalRecord)
async def get_medical_record(
    record_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    """Get a specific medical record by ID."""
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )

    return record


@router.put("/{record_id}", response_model=schemas.MedicalRecord)
async def update_medical_record(
    record_id: int,
    record_data: schemas.MedicalRecordUpdate,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    """Update a medical record."""
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )

    old_values = record_data.model_dump()
    update_data = record_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    try:
        audit.AuditLogger.log_update(
            db, current_user.id, "medical_records", record.id, old_values, update_data, request
        )
    except Exception as e:
        db.rollback()
        print(f"Audit logging failed: {e}")

    return record


@router.delete("/{record_id}")
async def delete_medical_record(
    record_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    """Delete a medical record."""
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )

    old_values = {
        "record_id": record.record_id,
        "patient_id": record.patient_id,
        "diagnosis": record.diagnosis,
    }

    db.delete(record)
    db.commit()

    try:
        audit.AuditLogger.log_delete(db, current_user.id, "medical_records", record_id, old_values, request)
    except Exception as e:
        db.rollback()
        print(f"Audit logging failed: {e}")

    return {"message": "Medical record deleted successfully"}