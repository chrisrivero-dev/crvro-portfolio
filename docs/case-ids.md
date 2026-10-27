# Case IDs (floppy disk labels)

Each physical floppy in the 3D workspace is one real project from `src/data/projects.js`.
The label prints a **case ID** from `src/data/caseIds.js`.

| Case ID | Project | Slug | Route |
|---|---|---|---|
| C-01 | Sidecar | `sidecar` | `/projects/sidecar` |
| C-02 | OpenClaw / Hermes | `openclaw` | `/projects/openclaw` |
| C-03 | Help Nearby | `help-nearby` | `/projects/help-nearby` |
| C-04 | Predmkt Bot | `predmkt-bot` | `/projects/predmkt-bot` (no disk: unlisted) |
| C-05 | GroundRules | `groundrules` | `/projects/groundrules` |
| C-06 | Zarvin One | `zarvin-one` | `/projects/zarvin-one` |
| C-07 | Proof First | `proof-first` | `/projects/proof-first` |
| G-01 | Parcel Engine | `parcel-engine` | `/projects/parcel-engine` |

Rules
- The ID is `C-<n>` for `PROJECTS` and `G-<n>` for `GIS_PROJECTS`, where `n` is the registry field. The registry `n` repeats across the two collections, which is why the letter is part of the ID.
- A case ID is **not** a Project World stop number. Stops (№ 01 to № 06, plus Daventry One at § 00) are the voyage order in `components/projectWorld/worldData.jsx` and may be reordered freely. They are never printed on a disk.
- IDs come from the registry at build time; nothing is typed by hand. `npm run case-ids:test` fails if an ID is duplicated, a disk project is missing from the registry, or a disk has no route.
- Adding a project: give it a registry `n`; it gets an ID automatically. To give it a disk, add its slug to `DISK_ORDER`.
