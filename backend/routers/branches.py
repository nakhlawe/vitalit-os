from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.core import database
from backend.core import security as auth
from backend import audit
import secrets
from datetime import datetime

router = APIRouter(prefix="/branches", tags=["Branches"])
hospitals_router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


def _gen_branch_id() -> str:
    return f"BR{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"


def _gen_hospital_id() -> str:
    return f"H{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"


# ─────────────────────────── Branches ───────────────────────────

@router.post("/", response_model=schemas.Branch, status_code=201)
async def create_branch(
    data: schemas.BranchCreate,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    branch = models.Branch(branch_id=_gen_branch_id(), **data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    audit.AuditLogger.log_create(db, current_user.id, "branches", branch.id, data.model_dump(), request)
    return branch


@router.get("/", response_model=List[schemas.Branch])
async def list_branches(
    active_only: bool = Query(False),
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Branch)
    if active_only:
        q = q.filter(models.Branch.is_active == True)
    return q.order_by(models.Branch.name).all()


@router.get("/{branch_id}", response_model=schemas.Branch)
async def get_branch(
    branch_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return branch


@router.put("/{branch_id}", response_model=schemas.Branch)
async def update_branch(
    branch_id: int,
    data: schemas.BranchUpdate,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    old = {k: getattr(branch, k) for k in data.model_dump(exclude_unset=True)}
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(branch, k, v)
    db.commit()
    db.refresh(branch)
    audit.AuditLogger.log_update(db, current_user.id, "branches", branch.id, old, data.model_dump(exclude_unset=True), request)
    return branch


@router.delete("/{branch_id}")
async def delete_branch(
    branch_id: int,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    audit.AuditLogger.log_delete(db, current_user.id, "branches", branch.id, {"name": branch.name}, request)
    db.delete(branch)
    db.commit()
    return {"message": "Branch deleted"}


# ─────────────────────── Doctor-Branch assignments ──────────────────────────

@router.post("/{branch_id}/doctors", response_model=schemas.DoctorBranch, status_code=201)
async def assign_doctor_to_branch(
    branch_id: int,
    data: schemas.DoctorBranchCreate,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    doctor = db.query(models.Doctor).filter(models.Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    existing = db.query(models.DoctorBranch).filter(
        models.DoctorBranch.doctor_id == data.doctor_id,
        models.DoctorBranch.branch_id == branch_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Doctor already assigned to this branch")
    assignment = models.DoctorBranch(**{**data.model_dump(), "branch_id": branch_id})
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/{branch_id}/doctors", response_model=List[schemas.DoctorBranch])
async def get_branch_doctors(
    branch_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    return db.query(models.DoctorBranch).filter(
        models.DoctorBranch.branch_id == branch_id,
        models.DoctorBranch.is_active == True,
    ).all()


@router.put("/{branch_id}/doctors/{assignment_id}", response_model=schemas.DoctorBranch)
async def update_doctor_branch(
    branch_id: int,
    assignment_id: int,
    data: schemas.DoctorBranchUpdate,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
):
    assignment = db.query(models.DoctorBranch).filter(
        models.DoctorBranch.id == assignment_id,
        models.DoctorBranch.branch_id == branch_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(assignment, k, v)
    db.commit()
    db.refresh(assignment)
    return assignment


# ─────────────────────────── Hospitals ───────────────────────────

@hospitals_router.post("/", response_model=schemas.Hospital, status_code=201)
async def create_hospital(
    data: schemas.HospitalCreate,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    hospital = models.Hospital(hospital_id=_gen_hospital_id(), **data.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    audit.AuditLogger.log_create(db, current_user.id, "hospitals", hospital.id, data.model_dump(), request)
    return hospital


@hospitals_router.get("/", response_model=List[schemas.Hospital])
async def list_hospitals(
    active_only: bool = Query(False),
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Hospital)
    if active_only:
        q = q.filter(models.Hospital.is_active == True)
    return q.order_by(models.Hospital.name).all()


@hospitals_router.get("/{hospital_id}", response_model=schemas.Hospital)
async def get_hospital(
    hospital_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@hospitals_router.put("/{hospital_id}", response_model=schemas.Hospital)
async def update_hospital(
    hospital_id: int,
    data: schemas.HospitalUpdate,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    old = {k: getattr(hospital, k) for k in data.model_dump(exclude_unset=True)}
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(hospital, k, v)
    db.commit()
    db.refresh(hospital)
    audit.AuditLogger.log_update(db, current_user.id, "hospitals", hospital.id, old, data.model_dump(exclude_unset=True), request)
    return hospital


@hospitals_router.delete("/{hospital_id}")
async def delete_hospital(
    hospital_id: int,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    audit.AuditLogger.log_delete(db, current_user.id, "hospitals", hospital.id, {"name": hospital.name}, request)
    db.delete(hospital)
    db.commit()
    return {"message": "Hospital deleted"}
