from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InventoryItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    current_quantity: int = Field(0, ge=0)
    minimum_quantity: int = Field(0, ge=0)
    unit_price: float = Field(0.0, ge=0)
    supplier: Optional[str] = Field(None, max_length=150)
    location: Optional[str] = Field(None, max_length=150)
    is_active: Optional[bool] = True


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    current_quantity: Optional[int] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=150)
    location: Optional[str] = Field(None, max_length=150)
    is_active: Optional[bool] = None


class InventoryItem(InventoryItemBase):
    id: int
    item_id: str
    status: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True