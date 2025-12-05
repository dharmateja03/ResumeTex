"""
Shared state for optimization tracking
Prevents circular imports between routes
"""
from typing import Dict, Any

# In-memory store for optimization status (in production, use Redis or database)
optimization_status_store: Dict[str, Dict[str, Any]] = {}
