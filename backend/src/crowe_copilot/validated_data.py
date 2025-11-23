"""Real validated chemistry dataset for testing and examples."""

from typing import Dict, List
from pydantic import BaseModel


class ValidatedCompound(BaseModel):
    """Validated compound with known correct data."""
    name: str
    smiles: str
    inchi: str
    inchikey: str
    formula: str
    mw: float
    source: str
    chembl_id: str | None = None
    pubchem_cid: str | None = None


# Curated set of validated natural products
VALIDATED_NATURAL_PRODUCTS: List[Dict] = [
    {
        "name": "Caffeine",
        "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
        "inchi": "InChI=1S/C8H10N4O2/c1-10-4-9-6-5(10)7(13)12(3)8(14)11(6)2/h4H,1-3H3",
        "inchikey": "RYYVLZVUVIJVGH-UHFFFAOYSA-N",
        "formula": "C8H10N4O2",
        "mw": 194.19,
        "chembl_id": "CHEMBL113",
        "pubchem_cid": "CID2519",
        "source": "Coffee, Tea",
    },
    {
        "name": "Aspirin",
        "smiles": "CC(=O)Oc1ccccc1C(=O)O",
        "inchi": "InChI=1S/C9H8O4/c1-6(10)13-8-5-3-2-4-7(8)9(11)12/h2-5H,1H3,(H,11,12)",
        "inchikey": "BSYNRYMUTXBXSQ-UHFFFAOYSA-N",
        "formula": "C9H8O4",
        "mw": 180.16,
        "chembl_id": "CHEMBL25",
        "pubchem_cid": "CID2244",
        "source": "Willow bark",
    },
    {
        "name": "Quercetin",
        "smiles": "O=c1c(O)c(-c2ccc(O)c(O)c2)oc2cc(O)cc(O)c12",
        "inchi": "InChI=1S/C15H10O7/c16-7-4-10(19)12-11(5-7)22-15(14(21)13(12)20)6-1-2-8(17)9(18)3-6/h1-5,16-19,21H",
        "inchikey": "REFJWTPEDVJJIY-UHFFFAOYSA-N",
        "formula": "C15H10O7",
        "mw": 302.24,
        "chembl_id": "CHEMBL50",
        "pubchem_cid": "CID5280343",
        "source": "Onions, apples, berries",
    },
    {
        "name": "Resveratrol",
        "smiles": "Oc1ccc(\\C=C\\c2cc(O)cc(O)c2)cc1",
        "inchi": "InChI=1S/C14H12O3/c15-12-5-3-10(4-6-12)1-2-11-7-13(16)9-14(17)8-11/h1-9,15-17H/b2-1+",
        "inchikey": "LUKBXSAWLPMMSZ-OWOJBTEDSA-N",
        "formula": "C14H12O3",
        "mw": 228.25,
        "chembl_id": "CHEMBL90",
        "pubchem_cid": "CID445154",
        "source": "Grapes, red wine",
    },
    {
        "name": "Curcumin",
        "smiles": "COc1cc(\\C=C\\C(=O)CC(=O)\\C=C\\c2ccc(O)c(OC)c2)ccc1O",
        "inchi": "InChI=1S/C21H20O6/c1-26-20-11-14(5-9-18(20)24)3-7-16(22)13-17(23)8-4-15-6-10-19(25)21(12-15)27-2/h3-12,24-25H,13H2,1-2H3/b7-3+,8-4+",
        "inchikey": "VFLDPWHFBUODDF-FCXRPNKRSA-N",
        "formula": "C21H20O6",
        "mw": 368.38,
        "chembl_id": "CHEMBL479",
        "pubchem_cid": "CID969516",
        "source": "Turmeric",
    },
    {
        "name": "Morphine",
        "smiles": "CN1CC[C@]23[C@@H]4[C@H]1CC5=C2C(=C(C=C5)O)O[C@H]3[C@H](C=C4)O",
        "inchi": "InChI=1S/C17H19NO3/c1-18-7-6-17-10-3-5-13(20)16(17)21-15-12(19)4-2-9(14(15)17)8-11(10)18/h2-5,10-11,13,16,19-20H,6-8H2,1H3/t10-,11+,13-,16-,17-/m0/s1",
        "inchikey": "BQJCRHHNABKAKU-KBQPJGBKSA-N",
        "formula": "C17H19NO3",
        "mw": 285.34,
        "chembl_id": "CHEMBL70",
        "pubchem_cid": "CID5288826",
        "source": "Opium poppy",
    },
    {
        "name": "Paclitaxel",
        "smiles": "CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)[C@H](O)[C@@H](NC(=O)c6ccccc6)c7ccccc7)O)(C)C",
        "inchi": "InChI=1S/C47H51NO14/c1-25-31(60-43(56)36(52)35(28-16-10-7-11-17-28)48-41(54)29-18-12-8-13-19-29)23-47(57)40(61-42(55)30-20-14-9-15-21-30)38-45(6,32(51)22-33-46(38,24-58-33)62-27(3)50)39(53)37(59-26(2)49)34(25)44(47,4)5/h7-21,31-33,35-38,40,51-52,57H,22-24H2,1-6H3,(H,48,54)/t31-,32-,33+,35-,36+,37+,38-,40-,45+,46-,47+/m0/s1",
        "inchikey": "RCINICONZNJXQF-MZXODVADSA-N",
        "formula": "C47H51NO14",
        "mw": 853.91,
        "chembl_id": "CHEMBL428",
        "pubchem_cid": "CID36314",
        "source": "Pacific yew tree",
    },
    {
        "name": "Artemisinin",
        "smiles": "C[C@H]1CC[C@H]2[C@@H](C)C(=O)O[C@@H]3O[C@@]45[C@@H]2[C@@H]1CC[C@@H]4OO[C@H]5C3(C)C",
        "inchi": "InChI=1S/C15H22O5/c1-8-4-5-11-9(2)12(16)17-13-15(11)10(8)6-7-14(3,18-13)20-19-15/h8-11,13H,4-7H2,1-3H3/t8-,9-,10+,11+,13-,14-,15-/m1/s1",
        "inchikey": "GOLCXWYRSKYTSP-GHPOANNYSA-N",
        "formula": "C15H22O5",
        "mw": 282.33,
        "chembl_id": "CHEMBL1288316",
        "pubchem_cid": "CID68827",
        "source": "Sweet wormwood (Artemisia annua)",
    },
    {
        "name": "Vincristine",
        "smiles": "CC[C@]1(C[C@@H]2C[C@@](C3=C(CCN(C2)C1)C4=CC=CC=C4N3)(C5=C(C=C6C(=C5)[C@]78CCN9[C@H]7[C@@](C=CC9)([C@H]([C@@]([C@@H]8N6C)(C(=O)OC)O)OC(=O)C)CC)OC)C(=O)OC)O",
        "inchi": "InChI=1S/C46H56N4O10/c1-7-42(53)22-28-23-46(40(51)57-5,35-30(14-18-48(24-28)25-42)29-12-9-10-13-33(29)47-35)32-20-31-34(21-36(32)56-4)49(26-38(31)52)39-44(54)45(55,37(50-3)27-41(39)58-6)43(59-39,2)16-19-60-15-11-8-17-44/h8-13,20-21,28,37-38,41,47,52-53,55H,7,14-19,22-27H2,1-6H3/t28-,37+,38-,39-,41+,42+,43+,44-,45+,46-/m0/s1",
        "inchikey": "OGWKCGZFUXNPDA-JKSGPKGLSA-N",
        "formula": "C46H56N4O10",
        "mw": 824.96,
        "chembl_id": "CHEMBL170",
        "pubchem_cid": "CID5978",
        "source": "Madagascar periwinkle",
    },
    {
        "name": "Epigallocatechin gallate",
        "smiles": "O=C(O[C@@H]1Cc2c(O)cc(O)cc2O[C@@H]1c3cc(O)c(O)c(O)c3)c4cc(O)c(O)c(O)c4",
        "inchi": "InChI=1S/C22H18O11/c23-10-5-12(24)11-7-18(33-22(31)9-3-14(26)19(29)15(27)4-9)21(32-20(11)6-10)8-1-2-16(28)17(30-22)28/h1-6,18,21,23-30H,7H2/t18-,21-/m0/s1",
        "inchikey": "WMBWREPUVVBILR-WIYYLYMNSA-N",
        "formula": "C22H18O11",
        "mw": 458.37,
        "chembl_id": "CHEMBL1201306",
        "pubchem_cid": "CID65064",
        "source": "Green tea",
    },
]


# Validated assay data with known EC50/IC50 values
VALIDATED_ASSAY_DATA: List[Dict] = [
    {
        "compound_name": "Caffeine",
        "compound_id": "CHEMBL113",
        "target": "Adenosine A2A receptor",
        "target_id": "CHEMBL203",
        "assay_type": "binding",
        "readout": "Ki",
        "value": 12.0,
        "unit": "uM",
        "source": "ChEMBL",
        "confidence": "high",
    },
    {
        "compound_name": "Aspirin",
        "compound_id": "CHEMBL25",
        "target": "Cyclooxygenase-1",
        "target_id": "CHEMBL221",
        "assay_type": "enzyme",
        "readout": "IC50",
        "value": 1.67,
        "unit": "uM",
        "source": "ChEMBL",
        "confidence": "high",
    },
    {
        "compound_name": "Quercetin",
        "compound_id": "CHEMBL50",
        "target": "Phosphoinositide 3-kinase alpha",
        "target_id": "CHEMBL4005",
        "assay_type": "enzyme",
        "readout": "IC50",
        "value": 3.8,
        "unit": "uM",
        "source": "ChEMBL",
        "confidence": "medium",
    },
    {
        "compound_name": "Resveratrol",
        "compound_id": "CHEMBL90",
        "target": "Sirtuin-1",
        "target_id": "CHEMBL4506",
        "assay_type": "functional",
        "readout": "EC50",
        "value": 46.0,
        "unit": "uM",
        "source": "Literature",
        "confidence": "medium",
    },
]


# Validated mixture/synergy data
VALIDATED_SYNERGY_DATA: List[Dict] = [
    {
        "mixture_name": "Quercetin + Curcumin",
        "component_a": "Quercetin",
        "component_b": "Curcumin",
        "target": "Cancer cell line A549",
        "ratio": "1:1",
        "synergy_model": "Bliss",
        "synergy_score": 0.15,  # Positive = synergy
        "interpretation": "synergy",
        "source": "Literature",
    },
    {
        "mixture_name": "Artemisinin + Curcumin",
        "component_a": "Artemisinin",
        "component_b": "Curcumin",
        "target": "P. falciparum malaria",
        "ratio": "1:2",
        "synergy_model": "Loewe",
        "combination_index": 0.7,  # CI < 1 = synergy
        "interpretation": "synergy",
        "source": "Literature",
    },
]


def get_validated_compound(name: str) -> Dict | None:
    """Get validated compound data by name."""
    for comp in VALIDATED_NATURAL_PRODUCTS:
        if comp["name"].lower() == name.lower():
            return comp
    return None


def get_test_smiles(count: int = 10) -> List[str]:
    """Get test SMILES strings for validation."""
    return [comp["smiles"] for comp in VALIDATED_NATURAL_PRODUCTS[:count]]


def get_test_dataset() -> Dict:
    """Get complete test dataset for integration testing."""
    return {
        "compounds": VALIDATED_NATURAL_PRODUCTS,
        "assays": VALIDATED_ASSAY_DATA,
        "synergy": VALIDATED_SYNERGY_DATA,
    }
