from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend import models, schemas
from backend.core import database
from backend.core import security as auth
from backend import audit
from backend.core.security import generate_inventory_id

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.post("/", response_model=schemas.InventoryItem, status_code=201)
async def create_inventory_item(
    item_data: schemas.InventoryItemCreate,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    """Create a new inventory item."""
    item_id = generate_inventory_id()

    db_item = models.InventoryItem(
        item_id=item_id,
        **item_data.model_dump(),
        status=_derive_status(item_data.current_quantity, item_data.minimum_quantity),
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    try:
        if current_user:
            audit.AuditLogger.log_create(
                db, current_user.id, "inventory", db_item.id,
                item_data.model_dump(), request
            )
    except Exception as e:
        db.rollback()
        print(f"Audit logging failed: {e}")

    return db_item


@router.get("/", response_model=List[schemas.InventoryItem])
async def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name, supplier, or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    low_stock_only: bool = Query(False, description="Only show low-stock items"),
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    """Get inventory items with optional filtering."""
    query = db.query(models.InventoryItem)

    if search:
        query = query.filter(
            or_(
                models.InventoryItem.name.ilike(f"%{search}%"),
                models.InventoryItem.supplier.ilike(f"%{search}%"),
                models.InventoryItem.category.ilike(f"%{search}%"),
                models.InventoryItem.item_id.ilike(f"%{search}%"),
            )
        )

    if category:
        query = query.filter(models.InventoryItem.category == category)

    if status:
        query = query.filter(models.InventoryItem.status == status)

    if low_stock_only:
        query = query.filter(
            models.InventoryItem.current_quantity <= models.InventoryItem.minimum_quantity
        )

    items = query.order_by(models.InventoryItem.name).offset(skip).limit(limit).all()
    return items


@router.get("/categories/all")
async def get_inventory_categories(
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    """Get distinct inventory categories."""
    from sqlalchemy import distinct

    categories = db.query(distinct(models.InventoryItem.category)).all()
    return {
        "categories": [c[0] for c in categories if c[0] is not None]
    }


@router.get("/{item_id}", response_model=schemas.InventoryItem)
async def get_inventory_item(
    item_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
):
    """Get a specific inventory item by ID."""
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == item_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )

    return item


@router.put("/{item_id}", response_model=schemas.InventoryItem)
async def update_inventory_item(
    item_id: int,
    item_data: schemas.InventoryItemUpdate,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    """Update an inventory item."""
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == item_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )

    old_values = item_data.model_dump()
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    new_quantity = item.current_quantity
    new_minimum = item.minimum_quantity
    if "current_quantity" in update_data:
        new_quantity = update_data["current_quantity"]
    if "minimum_quantity" in update_data:
        new_minimum = update_data["minimum_quantity"]
    item.status = _derive_status(new_quantity, new_minimum)

    db.commit()
    db.refresh(item)

    try:
        audit.AuditLogger.log_update(
            db, current_user.id, "inventory", item.id, old_values, update_data, request
        )
    except Exception as e:
        db.rollback()
        print(f"Audit logging failed: {e}")

    return item


@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: int,
    current_user: models.User = Depends(auth.require_staff),
    db: Session = Depends(database.get_db),
    request: Request = None,
):
    """Delete an inventory item."""
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == item_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )

    old_values = {
        "item_id": item.item_id,
        "name": item.name,
        "current_quantity": item.current_quantity,
        "status": item.status,
    }

    db.delete(item)
    db.commit()

    try:
        audit.AuditLogger.log_delete(db, current_user.id, "inventory", item_id, old_values, request)
    except Exception as e:
        db.rollback()
        print(f"Audit logging failed: {e}")

    return {"message": "Inventory item deleted successfully"}


def _derive_status(current_quantity: int, minimum_quantity: int) -> str:
    """Derive stock status from quantity levels."""
    if current_quantity <= 0:
        return "out_of_stock"
    if minimum_quantity is not None and current_quantity <= minimum_quantity:
        return "low_stock"
    return "in_stock"