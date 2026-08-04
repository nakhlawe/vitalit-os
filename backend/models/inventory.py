from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, Index
from sqlalchemy.sql import func
from backend.core.database import Base


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    unit = Column(String(50))
    current_quantity = Column(Integer, default=0, nullable=False)
    minimum_quantity = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)
    supplier = Column(String(150))
    location = Column(String(150))
    status = Column(String(50), default="in_stock", index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_inventory_name', 'name'),
        Index('idx_inventory_status', 'status'),
        Index('idx_inventory_category', 'category'),
    )