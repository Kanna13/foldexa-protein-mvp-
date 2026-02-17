"""
Unit tests for file validation.
"""
import pytest
from io import BytesIO
from fastapi import UploadFile, HTTPException

from app.core.validation import (
    validate_file_extension,
    validate_file_content,
    validate_pdb_structure,
    validate_upload_file,
    get_file_info,
)


def test_validate_file_extension_valid():
    """Test valid file extensions - only .pdb."""
    valid_extensions = ["test.pdb", "structure.pdb", "protein.PDB"]
    
    for filename in valid_extensions:
        is_valid, error = validate_file_extension(filename)
        assert is_valid is True
        assert error is None


def test_validate_file_extension_invalid():
    """Test invalid file extensions - everything except .pdb."""
    invalid_extensions = [
        "test.txt", "data.csv", "image.png", "doc.pdf",
        "structure.cif", "model.ent", "file.docx", "archive.zip",
        "model.pt", "data.json"
    ]
    
    for filename in invalid_extensions:
        is_valid, error = validate_file_extension(filename)
        assert is_valid is False
        assert error is not None
        assert "Invalid file extension" in error


def test_validate_file_content_empty():
    """Test validation of empty file."""
    is_valid, error = validate_file_content(b"")
    assert is_valid is False
    assert "empty" in error.lower()


def test_validate_file_content_too_large():
    """Test validation of oversized file."""
    large_content = b"A" * (51 * 1024 * 1024)  # 51 MB
    is_valid, error = validate_file_content(large_content)
    assert is_valid is False
    assert "exceeds maximum" in error.lower()


def test_validate_file_content_valid_pdb():
    """Test validation of valid PDB content."""
    pdb_content = b"""HEADER    TEST PROTEIN
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00  0.00           C
"""
    is_valid, error = validate_file_content(pdb_content)
    assert is_valid is True
    assert error is None


def test_validate_file_content_invalid():
    """Test validation of non-PDB content."""
    invalid_content = b"This is just plain text without any PDB records"
    is_valid, error = validate_file_content(invalid_content)
    assert is_valid is False
    assert "does not appear to be" in error


def test_validate_pdb_structure_valid():
    """Test structural validation of valid PDB."""
    pdb_content = b"""HEADER    TEST PROTEIN
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00  0.00           C
ATOM      3  C   ALA A   1       2.009   1.420   0.000  1.00  0.00           C
ATOM      4  O   ALA A   1       1.251   2.390   0.000  1.00  0.00           O
ATOM      5  CB  ALA A   1       1.962  -0.773   1.231  1.00  0.00           C
ATOM      6  N   GLY A   2       3.331   1.549   0.000  1.00  0.00           N
ATOM      7  CA  GLY A   2       3.982   2.851   0.000  1.00  0.00           C
ATOM      8  C   GLY A   2       5.496   2.729   0.000  1.00  0.00           C
ATOM      9  O   GLY A   2       6.101   1.657   0.000  1.00  0.00           O
ATOM     10  N   VAL A   3       6.141   3.894   0.000  1.00  0.00           N
"""
    is_valid, error = validate_pdb_structure(pdb_content)
    assert is_valid is True
    assert error is None


def test_validate_pdb_structure_too_few_atoms():
    """Test validation fails with too few atoms."""
    pdb_content = b"""HEADER    TEST
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
"""
    is_valid, error = validate_pdb_structure(pdb_content)
    assert is_valid is False
    assert "Minimum 10 atoms required" in error


@pytest.mark.asyncio
async def test_validate_upload_file_valid():
    """Test upload file validation with valid PDB."""
    pdb_content = b"""HEADER    TEST PROTEIN
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00  0.00           C
ATOM      3  C   ALA A   1       2.009   1.420   0.000  1.00  0.00           C
ATOM      4  O   ALA A   1       1.251   2.390   0.000  1.00  0.00           O
ATOM      5  CB  ALA A   1       1.962  -0.773   1.231  1.00  0.00           C
ATOM      6  N   GLY A   2       3.331   1.549   0.000  1.00  0.00           N
ATOM      7  CA  GLY A   2       3.982   2.851   0.000  1.00  0.00           C
ATOM      8  C   GLY A   2       5.496   2.729   0.000  1.00  0.00           C
ATOM      9  O   GLY A   2       6.101   1.657   0.000  1.00  0.00           O
ATOM     10  N   VAL A   3       6.141   3.894   0.000  1.00  0.00           N
"""
    
    file = UploadFile(filename="test.pdb", file=BytesIO(pdb_content))
    
    # Should not raise exception
    await validate_upload_file(file)


@pytest.mark.asyncio
async def test_validate_upload_file_invalid_extension():
    """Test upload file validation with invalid extension."""
    file = UploadFile(filename="test.txt", file=BytesIO(b"content"))
    
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_file(file)
    
    assert exc_info.value.status_code == 400
    assert "Invalid file extension" in exc_info.value.detail


def test_get_file_info():
    """Test extraction of file metadata."""
    pdb_content = b"""HEADER    TEST PROTEIN
TITLE     THIS IS A TEST STRUCTURE
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00  0.00           C
ATOM      3  C   ALA B   1       2.009   1.420   0.000  1.00  0.00           C
"""
    
    info = get_file_info(pdb_content)
    
    assert info["has_header"] is True
    assert "TEST STRUCTURE" in info["title"]
    assert info["atom_count"] == 3
    assert set(info["chain_ids"]) == {"A", "B"}
