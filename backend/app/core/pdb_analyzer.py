"""
PDB Structure Analyzer for Adaptive Model Selection.

Analyzes PDB files to determine optimal DiffAb mode based on:
- Chain count
- Antibody detection
- Structure characteristics
"""
from typing import Dict, List, Set
import re
import logging

logger = logging.getLogger(__name__)


class PDBAnalyzer:
    """Analyzes PDB files to recommend optimal pipeline configuration."""
    
    # Keywords that indicate antibody structures
    ANTIBODY_KEYWORDS = [
        'ANTIBODY', 'IMMUNOGLOBULIN', 'FAB', 'FV', 'VH', 'VL',
        'HEAVY CHAIN', 'LIGHT CHAIN', 'CDR', 'ANTIGEN',
        'SCFV', 'NANOBODY', 'CAMELID', 'IGG', 'IGA', 'IGM',
        'VARIABLE DOMAIN', 'CONSTANT DOMAIN', 'FRAMEWORK'
    ]
    
    # Filename patterns that indicate antibodies
    ANTIBODY_FILENAME_PATTERNS = [
        r'\bAB\b', r'\bFAB\b', r'\bFV\b', r'\bSCFV\b',
        r'ANTIBODY', r'IGG', r'IGA', r'IGM',
        r'VH', r'VL', r'HEAVY', r'LIGHT',
        r'TAAB', r'MAB', r'NANOBODY'  # Added TAAB for mTie2-hTAAB
    ]
    
    @staticmethod
    def analyze(pdb_content: str, filename: str = "") -> Dict:
        """
        Analyze PDB structure and recommend optimal DiffAb mode.
        
        Args:
            pdb_content: PDB file content as string
            
        Returns:
            Dictionary with analysis results:
            {
                'chains': List of chain IDs,
                'chain_count': Number of chains,
                'is_antibody': Boolean indicating antibody detection,
                'recommended_mode': Recommended DiffAb mode,
                'confidence': Confidence level (high/medium/low)
            }
        """
        try:
            # Extract chains
            chains = PDBAnalyzer._extract_chains(pdb_content)
            
            # Detect antibody
            is_antibody = PDBAnalyzer._detect_antibody(pdb_content, filename)
            
            # Recommend mode
            mode = PDBAnalyzer._recommend_mode(chains, is_antibody)
            
            # Determine confidence
            confidence = 'high' if is_antibody else 'medium'
            
            result = {
                'chains': chains,
                'chain_count': len(chains),
                'is_antibody': is_antibody,
                'recommended_mode': mode,
                'confidence': confidence
            }
            
            logger.info(f"PDB Analysis: {result}")
            return result
            
        except Exception as e:
            logger.error(f"PDB analysis failed: {e}")
            # Return safe defaults
            return {
                'chains': [],
                'chain_count': 0,
                'is_antibody': False,
                'recommended_mode': 'codesign_multicdrs',
                'confidence': 'low'
            }
    
    @staticmethod
    def _extract_chains(pdb_content: str) -> List[str]:
        """
        Extract unique chain IDs from PDB file.
        
        Args:
            pdb_content: PDB file content
            
        Returns:
            Sorted list of unique chain IDs
        """
        chains: Set[str] = set()
        
        for line in pdb_content.split('\n'):
            if line.startswith('ATOM') or line.startswith('HETATM'):
                # Chain ID is at position 21 (0-indexed: 21)
                if len(line) > 21:
                    chain_id = line[21:22].strip()
                    if chain_id and chain_id.isalnum():
                        chains.add(chain_id)
        
        return sorted(list(chains))
    
    @staticmethod
    def _detect_antibody(pdb_content: str, filename: str = "") -> bool:
        """
        Detect if structure is an antibody based on keywords and filename.
        
        Args:
            pdb_content: PDB file content
            filename: Optional filename to check for antibody patterns
            
        Returns:
            True if antibody detected, False otherwise
        """
        upper_content = pdb_content.upper()
        
        # Check filename first (most reliable for user-named files)
        if filename:
            upper_filename = filename.upper()
            for pattern in PDBAnalyzer.ANTIBODY_FILENAME_PATTERNS:
                if re.search(pattern, upper_filename):
                    logger.info(f"Antibody detected from filename pattern: {pattern}")
                    return True
        
        # Check for antibody keywords in header/remarks
        for keyword in PDBAnalyzer.ANTIBODY_KEYWORDS:
            if keyword in upper_content:
                logger.debug(f"Antibody keyword detected: {keyword}")
                return True
        
        return False
    
    @staticmethod
    def _recommend_mode(chains: List[str], is_antibody: bool) -> str:
        """
        Recommend DiffAb mode based on structure analysis.
        
        Args:
            chains: List of chain IDs
            is_antibody: Whether structure is detected as antibody
            
        Returns:
            Recommended mode: 'codesign_single', 'codesign_multicdrs', 'fixbb', or 'strpred'
        """
        chain_count = len(chains)
        
        # Decision logic
        if is_antibody and chain_count >= 2:
            # Antibody-antigen complex - design all CDRs
            return 'codesign_multicdrs'
        elif is_antibody and chain_count == 1:
            # Single antibody chain - design one CDR
            return 'codesign_single'
        elif chain_count >= 2:
            # Multi-chain complex (not confirmed antibody)
            return 'codesign_multicdrs'
        elif chain_count == 1:
            # Single chain - fix backbone sequence design
            return 'fixbb'
        else:
            # Default fallback
            return 'codesign_multicdrs'
    
    @staticmethod
    def get_checkpoint_path(mode: str) -> str:
        """
        Get checkpoint file path for given mode.
        
        Args:
            mode: DiffAb mode
            
        Returns:
            Path to checkpoint file
        """
        checkpoint_map = {
            'codesign_single': '/app/checkpoints/codesign_single.pt',
            'codesign_multicdrs': '/app/checkpoints/codesign_multicdrs.pt',
            'fixbb': '/app/checkpoints/fixbb.pt',
            'strpred': '/app/checkpoints/structure_pred.pt'
        }
        
        return checkpoint_map.get(mode, checkpoint_map['codesign_multicdrs'])
