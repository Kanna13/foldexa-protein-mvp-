
import os

# Define the 3to1 map directly
protein_letters_3to1 = {
    'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E',
    'PHE': 'F', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I',
    'LYS': 'K', 'LEU': 'L', 'MET': 'M', 'ASN': 'N',
    'PRO': 'P', 'GLN': 'Q', 'ARG': 'R', 'SER': 'S',
    'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y',
}

target_file = "/app/diffab/tools/renumber/run.py"

with open(target_file, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Remove the bad import
    if "from Bio.Data import SCOPData" in line:
        new_lines.append("# " + line) # Comment out
    # Replace usage
    elif "SCOPData.protein_letters_3to1" in line:
        line = line.replace("SCOPData.protein_letters_3to1", "protein_letters_3to1")
        new_lines.append(line)
    else:
        new_lines.append(line)

# Add the definition after imports (line 7 approx)
insert_idx = 7
code_block = [
    "\n# Patched: SCOPData replacement\n",
    "protein_letters_3to1 = {\n",
    "    'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E',\n",
    "    'PHE': 'F', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I',\n",
    "    'LYS': 'K', 'LEU': 'L', 'MET': 'M', 'ASN': 'N',\n",
    "    'PRO': 'P', 'GLN': 'Q', 'ARG': 'R', 'SER': 'S',\n",
    "    'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y',\n",
    "}\n"
]

# Insert after existing imports
new_lines[insert_idx:insert_idx] = code_block

with open(target_file, 'w') as f:
    f.writelines(new_lines)

print(f"Successfully patched {target_file}")
