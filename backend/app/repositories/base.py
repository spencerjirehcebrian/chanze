from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional
from beanie import Document
from pymongo import IndexModel

DocumentType = TypeVar("DocumentType", bound=Document)


class BaseRepository(Generic[DocumentType], ABC):
    def __init__(self, model: type[DocumentType]):
        self.model = model

    async def create(self, **kwargs) -> DocumentType:
        """Create a new document"""
        document = self.model(**kwargs)
        await document.insert()
        return document

    async def get_by_id(self, document_id: str) -> Optional[DocumentType]:
        """Get document by ID"""
        return await self.model.get(document_id)

    async def get_by_field(self, field: str, value) -> Optional[DocumentType]:
        """Get document by field value"""
        return await self.model.find_one({field: value})

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[DocumentType]:
        """Get all documents with pagination"""
        return await self.model.find().skip(skip).limit(limit).to_list()

    async def update(self, document_id: str, **kwargs) -> Optional[DocumentType]:
        """Update document by ID"""
        document = await self.get_by_id(document_id)
        if document:
            for key, value in kwargs.items():
                if hasattr(document, key):
                    setattr(document, key, value)
            await document.save()
            return document
        return None

    async def delete(self, document_id: str) -> bool:
        """Delete document by ID"""
        document = await self.get_by_id(document_id)
        if document:
            await document.delete()
            return True
        return False

    async def count(self) -> int:
        """Count total documents"""
        return await self.model.count()

    async def exists(self, **kwargs) -> bool:
        """Check if document exists"""
        count = await self.model.find(kwargs).count()
        return count > 0