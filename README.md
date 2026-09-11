# chemistry-data-facto

A Python library and command line tool that standardizes SMILES, computes descriptors and similarity, fits dose-response curves and scores mixture synergy for natural-product chemists, bundled with an unfinished browser code editor generated with GitHub Spark.

Two packages live here. `backend/` is the Python package `crowe-research-copilot` (console script `crowe-copilot`, alias `crc`). The repo root is the Vite and React app `crowe-code`. The repo name is a truncated "chemistry data factory" and nothing in the code uses it.

## Status

experimental. The Python library works and 41 of its 48 tests pass. Most of the rest does not run:

- The FastAPI server does not start. `python src/api.py` fails at import with `cannot import name 'Reaction' from 'crowe_copilot.models'`. `crowe-copilot serve` fails with `No module named 'crowe_copilot.api'` because `api.py` sits outside the package.
- The frontend does not build. `npm run build` runs `tsc -b` first, which reports 552 type errors, most of them in the 3D and VR components under `src/components/` and `src/lib/three-utils.ts`. `npx vite build` on its own does bundle.
- `npm ci` fails because `package-lock.json` is out of sync with `package.json` (the lock pins `@github/spark@0.0.1`; `package.json` asks for `^0.39.0`). The root `Dockerfile` runs `npm ci`, so the container build fails too.
- The frontend chemistry client (`src/lib/api.ts`) calls `/compounds`, `/reactions` and `/literature`. The backend defines none of those routes.
- 7 tests fail: a NetworkX export format change, a missing `pyarrow.parquet` import, four checks against the module called `validated_data` whose reference values are wrong, and one that needs the optional `mordred` package.
- Every deploy target we could check is dead. The Vercel homepage in the repo settings returns HTTP 402. `crowe-code.fly.dev` does not answer. The Azure workflow has failed on each of its last five runs and still carries the placeholder app name `your-app-name`.

## Install and first run

Run on 2026-09-10 on macOS. We used Python 3.12 because `pyproject.toml` pins `numba` below 0.60 and `numpy` below 2. We did not try 3.13.

### Backend

```
$ cd backend
$ uv venv --python 3.12 .venv && source .venv/bin/activate
$ python --version
Python 3.12.12
$ uv pip install -e ".[dev]"
```

The install finished without errors (last lines listed `uvloop`, `watchfiles`, `websockets`, `wrapt`, `xlsxwriter`).

```
$ pytest
7 failed, 41 passed in 77.24s (0:01:17)
TOTAL                                       1581   1088    31%
```

The `TOTAL` line is the coverage report that `pyproject.toml` turns on by default: 1581 statements, 1088 missed, 31 percent covered. The failures, one line each:

```
$ pytest --no-cov -rf --tb=line
tests/test_kg.py:129: AssertionError: assert 'links' in {'directed': True, 'multigraph': True, ...
src/crowe_copilot/pq_registry.py:78: AttributeError: module 'pyarrow' has no attribute 'parquet'. Did you mean: '_parquet'?
tests/test_validated_data.py:28: AssertionError: InChIKey mismatch for Resveratrol
tests/test_validated_data.py:43: AssertionError: MW mismatch for Artemisinin: 336.42800000000005 vs 282.33
tests/test_validated_data.py:73: AssertionError: assert None is not None
tests/test_validated_data.py:140: AssertionError: Polyphenols should have some structural similarity
tests/test_validated_data.py:192: assert None is not None
7 failed, 41 passed in 2.80s
```

The command line tool runs:

```
$ crowe-copilot --help
 Usage: crowe-copilot [OPTIONS] COMMAND [ARGS]...

 Natural Products Chemistry Intelligence CLI

 Commands
  standardize  Standardize SMILES and compute molecular descriptors.
  analyze      Analyze compound library (drug-likeness, diversity, etc.).
  fetch        Fetch compounds from external databases.
  serve        Start FastAPI server.
  version      Show version information.
```

A real run on a three-row CSV:

```
$ cat /tmp/chem-in.csv
name,smiles
ethanol,CCO
aspirin,CC(=O)Oc1ccccc1C(=O)O
bad,notasmiles

$ crowe-copilot standardize /tmp/chem-in.csv /tmp/chem-out.csv --name-col name
  Standardizing compounds...
Writing results to /tmp/chem-out.csv...
  Standardization Summary
  Total compounds   3
  Valid SMILES      2
  Invalid/Failed    1
  Success rate      66.7%
Results saved to /tmp/chem-out.csv

$ cat /tmp/chem-out.csv
original_smiles,name,std_smiles,is_valid,inchikey,mw,logp,tpsa,hbd,hba,rot_bonds
CCO,ethanol,CCO,true,LFQSCWFLJHTTHZ-UHFFFAOYSA-N,46.069,-0.0014000000000000123,20.23,1,1,0
CC(=O)Oc1ccccc1C(=O)O,aspirin,CC(=O)Oc1ccccc1C(=O)O,true,BSYNRYMUTXBXSQ-UHFFFAOYSA-N,180.15899999999996,1.3101,63.60000000000001,1,3,2
notasmiles,bad,,false,,,,,,,
```

(The summary is a Rich table in the terminal; box characters trimmed here.)

The API does not start:

```
$ PORT=8811 python src/api.py
Traceback (most recent call last):
  File ".../backend/src/api.py", line 11, in <module>
    from crowe_copilot.models import (
ImportError: cannot import name 'Reaction' from 'crowe_copilot.models' (.../backend/src/crowe_copilot/models.py). Did you mean: 'Fraction'?

$ crowe-copilot serve --port 8812
ModuleNotFoundError: No module named 'crowe_copilot.api'
```

### Frontend

```
$ node --version
v26.5.0
$ npm --version
11.17.0
$ npm ci --no-audit --no-fund
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with `npm install` before continuing.
npm error Invalid: lock file's @github/spark@0.0.1 does not satisfy @github/spark@0.39.144
npm error Missing: octokit@5.0.5 from lock file

$ npm install --no-audit --no-fund
(installs; 271 entries in node_modules; rewrites package-lock.json, which we did not commit)

$ npm run build
src/lib/three-utils.ts(308,51): error TS2339: Property 'Vector3' does not exist on type 'typeof import("three")'.
... 552 errors in total; files with the most: three-utils.ts 81, DataVisualization3D.tsx 49, VRWorkspace.tsx 43, 3DFloatingIslands.tsx 37, LazyComponents.tsx 30 ...
exit 1

$ npx vite build
dist/assets/vendor-three-CPBBBVic.js                   485.64 kB | gzip: 120.92 kB
built in 4.45s
```

Steps we did not run today: `npm run dev` or opening the app in a browser, `npm run lint`, `crowe-copilot analyze` and `fetch`, any ORCID or Zenodo call, `docker build`, `railway-deploy.sh`, `quickstart.sh`, the Azure workflow.

## What runs today

Backend, each with a test file unless noted:

- SMILES handling with RDKit: `to_mol`, `standardize_smiles`, `to_inchi`, `to_inchikey`, `descriptors` (mw, logp, tpsa, hbd, hba, rot_bonds), `morgan_bits`, `tanimoto_similarity`, `has_substructure`, `murcko_scaffold`, `lipinski_violations`. `backend/src/crowe_copilot/chem_utils.py`; `tests/test_rdkit.py`.
- Dose-response fitting with SciPy: `four_pl`, `five_pl`, `fit_4pl`, `fit_5pl`, `auto_fit`, `calculate_ci95`. `dose_response.py`; `tests/test_dose_response.py`.
- Mixture synergy: `bliss_independence`, `hsa_reference`, `synergy_score_bliss`, `synergy_score_hsa`, `synergy_score_zip`, `classify_synergy`, `combination_index_loewe`, `mixture_ec50_shift`. `mixtures.py`; `tests/test_mixtures.py`.
- A typed NetworkX multigraph for compounds, targets and assays: `new_kg`, `add_node`, `add_edge`, `neighbors_by_type`, `edges_by_type`, `find_paths`, `subgraph_around_node`, degree and betweenness centrality, `find_communities`, `export_to_dict`, `import_from_dict`. `kg.py`; `tests/test_kg.py` (the export and import round trip is the failing test).
- Pydantic models: `Evidence`, `Compound`, `Target`, `Extract`, `Fraction`, `AssayResult`, `DoseResponseFit`, `MixtureComponent`, `Mixture`, `Publication`. `models.py`; `tests/test_models.py`.
- CLI `standardize` on CSV or Excel input, shown above. `cli.py`. No test.
- ORCID and Zenodo HTTP clients exist in `orcid_client.py` and `zenodo_client.py`. No tests, not run.

Frontend:

- `npx vite build` produces a bundle. The source is an editor shell (file tree, tabs, editor, status bar, settings) whose state is stored through Spark's `useKV` hook, plus about sixty panels and 3D scenes. We did not run it in a browser and make no claim about what renders.

## Roadmap

Nothing is committed to. The forty markdown files at the repo root (roadmaps, readiness analyses, showcase guides, implementation summaries) were generated by GitHub Spark and Copilot sessions. Treat them as brainstorming, not as a plan or as fact.

If work resumes, the first jobs, none started, would be: fix the `Reaction` import or move `api.py` into the package; either add `/compounds`, `/reactions`, `/literature` to the backend or remove them from `src/lib/api.ts`; regenerate `package-lock.json`; fix or drop the 3D and VR components so `tsc` passes; correct or delete `validated_data.py`; import `pyarrow.parquet` in `pq_registry.py`; update the `kg` export test for the NetworkX `edges` key.

## Limits

This is not validated chemistry software. The module named `validated_data.py` calls itself "real validated chemistry data" and its own tests prove otherwise: the Artemisinin entry's SMILES computes to a molecular weight of 336.43 against a listed 282.33, and the Resveratrol InChIKey does not match its SMILES. Check every value against PubChem or ChEMBL before relying on it. Do not use output from this repo for research conclusions, formulation, dosing, or any regulatory purpose.

There is no license key mechanism. `LICENSE` says access requires a valid license key. No code checks one.

The frontend's language-model features need GitHub Spark's runtime. They call `window.spark.llm` with `gpt-4o` and `gpt-4o-mini`; outside Spark hosting `window.spark` is undefined. A separate chat helper in `src/lib/` uses the OpenAI provider from Vercel's model SDK and reads its key from a `VITE_` environment variable, which Vite inlines into the browser bundle. The research paper panel asks the model to "Generate 5 realistic academic" paper entries; those are fabricated listings, not a literature search.

Backend security facts, not a review: CORS is `allow_origins=["*"]` with `allow_credentials=True`; the ORCID callback returns the user's access token in the JSON response body. No security review has been done.

Committed artefacts: `.venv/pyvenv.cfg`, `backend/.coverage`, `__pycache__/*.pyc` and `*.egg-info` are tracked. Running the tests modifies tracked files.

Naming: `backend/README.md` describes this in far stronger terms than what ran today supports; read it as a draft. The FastAPI title, the Typer app name (`np-copilot`), the package name and the repo name are four different names for one codebase.

Frontend telemetry: `src/lib/analytics.ts` initialises PostHog when `VITE_POSTHOG_KEY` is set. `src/lib/supabase.ts` creates a Supabase client when its URL and anon key are set. Neither is configured in the repo.

## License and contact

Proprietary. Copyright 2025 Crowe Logic, Inc. All rights reserved. See `LICENSE` at the root and `backend/LICENSE` (same text); `backend/pyproject.toml` declares `Proprietary`. Files that came from GitHub's Spark template are GitHub's, under the MIT license, as the template's original README stated.

michael@crowelogic.com
