"""
File validation utilities for protein structure files.
"""
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
import logging

logger = logging.getLogger(__name__)

# Allowed file extensions - ONLY PDB format
ALLOWED_EXTENSIONS = {
    ".pdb",   # Protein Data Bank format - ONLY accepted format
}

# MIME types for file upload
ALLOWED_MIME_TYPES = [
    "chemical/x-pdb",
    "text/plain",  # PDB files are often served as text
]

# Maximum file size (50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

# PDB file signatures
PDB_SIGNATURES = [
    b"HEADER",
    b"TITLE",
    b"ATOM",
    b"HETATM",
    b"CRYST1",
    b"MODEL",
]


def validate_file_extension(filename: str) -> Tuple[bool, Optional[str]]:
    """
    Validate file extension.
    
    Returns:
        (is_valid, error_message)
    """
    file_path = Path(filename)
    extension = file_path.suffix.lower()
    
    if extension not in ALLOWED_EXTENSIONS:
        return False, (
            f"Invalid file extension '{extension}'. "
            f"Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    return True, None


def validate_file_content(content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate file content to ensure it's a valid protein structure file.
    
    Returns:
        (is_valid, error_message)
    """
    # Check if file is empty
    if not content or len(content) == 0:
        return False, "File is empty"
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024} MB"
    
    # Check for PDB signatures in first 1000 bytes
    header = content[:1000]
    
    # Check if any PDB signature is present
    has_signature = any(sig in header for sig in PDB_SIGNATURES)
    
    if not has_signature:
        # Try to decode as text and check for common PDB keywords
        try:
            text = header.decode('utf-8', errors='ignore')
            if any(keyword in text for keyword in ["ATOM", "HETATM", "HEADER", "TITLE"]):
                has_signature = True
        except Exception:
            pass
    
    if not has_signature:
        return False, (
            "File does not appear to be a valid protein structure file. "
            "Expected PDB format with ATOM, HETATM, or HEADER records."
        )
    
    return True, None


def validate_pdb_structure(content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Perform basic structural validation of PDB file.
    
    Returns:
        (is_valid, error_message)
    """
    try:
        text = content.decode('utf-8', errors='ignore')
        lines = text.split('\n')
        
        # Check for minimum number of ATOM records
        atom_count = sum(1 for line in lines if line.startswith(('ATOM', 'HETATM')))
        
        if atom_count < 10:
            return False, f"File contains only {atom_count} atoms. Minimum 10 atoms required."
        
        # Check for valid PDB line format (80 characters max)
        for i, line in enumerate(lines[:100], 1):  # Check first 100 lines
            if len(line) > 80 and line.startswith(('ATOM', 'HETATM')):
                logger.warning(f"Line {i} exceeds 80 characters (PDB format violation)")
        
        return True, None
    
    except Exception as e:
        return False, f"Error parsing PDB structure: {str(e)}"


async def validate_upload_file(file: UploadFile) -> None:
    """
    Comprehensive validation for uploaded protein structure files.
    
    Raises:
        HTTPException: If validation fails
    """
    # Validate filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Validate extension
    is_valid, error = validate_file_extension(file.filename)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Read file content
    content = await file.read()
    await file.seek(0)  # Reset file pointer for later use
    
    # Validate content
    is_valid, error = validate_file_content(content)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Validate PDB structure
    is_valid, error = validate_pdb_structure(content)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    logger.info(f"File validation passed: {file.filename} ({len(content)} bytes)")


def get_file_info(content: bytes) -> dict:
    """
    Extract basic information from PDB file.
    
    Returns:
        Dictionary with file metadata
    """
    try:
        text = content.decode('utf-8', errors='ignore')
        lines = text.split('\n')
        
        info = {
            "atom_count": 0,
            "residue_count": 0,
            "chain_ids": set(),
            "has_header": False,
            "title": None,
        }
        
        for line in lines:
            if line.startswith("HEADER"):
                info["has_header"] = True
            elif line.startswith("TITLE"):
                info["title"] = line[10:].strip()
            elif line.startswith(("ATOM", "HETATM")):
                info["atom_count"] += 1
                if len(line) > 21:
                    chain_id = line[21]
                    if chain_id.strip():
                        info["chain_ids"].add(chain_id)
        
        info["chain_ids"] = list(info["chain_ids"])
        
        return info
    
    except Exception as e:
        logger.error(f"Error extracting file info: {e}")
        return {}
