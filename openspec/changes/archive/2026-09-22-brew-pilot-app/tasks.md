# Tasks

## 1. Project Setup - Backend

- [x] 1.1 Create backend/ directory with pyproject.toml (name: brew-copilot-backend, Python 3.12). Verify: `pip install -e .` succeeds
- [x] 1.2 Add dependencies: fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings. Verify: imports work in Python REPL
- [x] 1.3 Create directory structure: app/, app/models/, app/schemas/, app/calculators/, app/routers/, app/data/. Verify: all directories exist
- [x] 1.4 Download BJCP styles.json from https://github.com/ascholer/bjcp-styleview and save to app/data/styles.json. Verify: file exists and loads as valid JSON
- [x] 1.5 Create backend/Dockerfile with Python 3.12-slim, uvicorn entrypoint. Verify: `docker build` succeeds

## 2. Project Setup - Frontend

- [x] 2.1 Create frontend/ with Vite + React + TypeScript: `npm create vite@latest frontend -- --template react-ts`. Verify: `npm run dev` starts on port 5173
- [x] 2.2 Install additional dependencies: axios (API client). Verify: `npm install` succeeds
- [x] 2.3 Create directory structure: src/api/, src/components/, src/hooks/, src/types/, src/styles/. Verify: all directories exist
- [x] 2.4 Create frontend/Dockerfile with multi-stage build (node build + nginx). Verify: `docker build` succeeds
- [x] 2.5 Create nginx.conf with proxy to backend /api/. Verify: config is valid

## 3. Database Setup

- [x] 3.1 Create app/database.py with SQLAlchemy engine, sessionmaker, Base. Verify: can create in-memory test DB
- [x] 3.2 Create app/models/recipe.py with Recipe, Grain, HopAddition models. Verify: models create tables correctly
- [x] 3.3 Create app/models/session.py with BrewSession, SessionReading models. Verify: models create tables correctly
- [x] 3.4 Create app/schemas/ with Pydantic schemas for all models. Verify: schemas validate sample data

## 4. Calculator Modules

- [x] 4.1 Implement app/calculators/mash.py with strike_water, mash_volume, grain_absorption, sparge_water functions. Verify: pytest tests pass for all scenarios in mash-calculator spec
- [x] 4.2 Implement app/calculators/gravity.py with sg_to_plato, plato_to_sg, efficiency, water_adjustment functions. Verify: pytest tests pass for all scenarios in gravity-tracker spec
- [x] 4.3 Implement app/calculators/hops.py with tinseth_ibu, utilization, recalculate_hops functions. Verify: pytest tests pass for all scenarios in hop-calculator spec
- [x] 4.4 Implement app/calculators/water.py with calculate_salts, calculate_acid functions for 3 profiles. Verify: pytest tests pass for all scenarios in water-chemistry spec
- [x] 4.5 Implement app/calculators/carbonation.py with priming_sugar, force_carb_psi functions. Verify: pytest tests pass for carbonation scenarios in brew-session spec
- [x] 4.6 Implement app/calculators/style_validator.py with load_styles, validate_params, deviation_severity functions. Verify: pytest tests pass for all scenarios in style-guidelines spec

## 5. API Routes

- [x] 5.1 Create app/main.py with FastAPI app, CORS middleware (allow localhost:5173), include routers. Verify: `uvicorn app.main:app` starts on port 8000, /docs shows Swagger UI
- [x] 5.2 Implement app/routers/calculate.py with POST endpoints /mash, /gravity, /hops, /water. Verify: curl/httpie requests return correct calculations
- [x] 5.3 Implement app/routers/recipes.py with CRUD endpoints. Verify: can create, read, update, delete recipes via API
- [x] 5.4 Implement app/routers/sessions.py with CRUD, phase advancement, reading registration. Verify: can create session, advance phases, record readings
- [x] 5.5 Implement app/routers/styles.py with GET /styles, GET /styles/{id}, POST /validate/style. Verify: curl requests return styles and validation results

## 6. Frontend - Base Structure

- [x] 6.1 Create src/api/client.ts with axios instance, typed functions for all API endpoints. Verify: TypeScript compiles without errors
- [x] 6.2 Create src/types/index.ts with TypeScript interfaces matching backend Pydantic schemas. Verify: types match API responses
- [x] 6.3 Create src/App.tsx with React Router, navigation between calculator views. Verify: navigation works in browser
- [x] 6.4 Create src/styles/main.css with mobile-first responsive design, large touch targets. Verify: UI usable on mobile viewport (375px)

## 7. Frontend - Calculator Components

- [x] 7.1 Create src/components/MashCalculator.tsx: grain weight, water ratio, kettle capacity, sparge toggle. Verify: inputs calculate and display results matching spec scenarios
- [x] 7.2 Create src/components/GravityTracker.tsx: gravity inputs per phase, expected vs actual comparison. Verify: displays deviations and water adjustment calculations
- [x] 7.3 Create src/components/HopCalculator.tsx: hop additions table, IBU display, time adjustment. Verify: changing boil time recalculates hop amounts
- [x] 7.4 Create src/components/WaterChemistry.tsx: profile selector, volume inputs, salt/acid results. Verify: changing profile updates calculations instantly
- [x] 7.5 Create src/components/StyleSelector.tsx: searchable dropdown, style details modal. Verify: can search and select styles, view full BJCP description
- [x] 7.6 Create src/components/ConformityBadge.tsx: green/orange/red indicators with deviation %. Verify: indicators update in real-time as values change
- [x] 7.7 Create conformity summary component showing "X/5 within style" with parameter list. Verify: summary accurately reflects all validations
- [x] 7.8 Create src/components/GravityInput.tsx with digit mask (4 digits, point inserted after first: "1052" → 1.052, "0998" → 0.998, numeric keypad) and apply to all SG fields in GravityTracker, HopCalculator (wort OG) and StyleView (OG/FG). Verify: typing "1052" shows 1.052 and triggers calculation; partial input does not

## 8. Frontend - Brew Day (página única)

- [x] 8.1 Add ibu, srm, abv target fields to Recipe model and schemas (backend). Verify: recipe CRUD saves and returns the new fields
- [x] 8.2 Create src/components/RecipeForm.tsx embedded in the brew day page: style, OG/FG (GravityInput), IBU, SRM, ABV, volumes, equipment, grain bill, hops; save/load. Verify: can save and reload a complete recipe
- [x] 8.3 Create src/components/BrewDay.tsx as the home page: create or resume a session from a recipe, recipe vs style comparison (ConformityBadge + ConformitySummary). Verify: selecting a style and filling the recipe shows indicators and "X/5 within style"
- [x] 8.4 Create src/components/PhaseSection.tsx: one section per phase on the same page with expected vs actual inputs (SG values use GravityInput), deviation, advance phase without leaving the page; completed phases stay visible. Verify: after advancing Mash → Lauter, mash values remain visible and Lauter is active
- [x] 8.5 Implement style validation for actual values in each phase. Verify: red/orange indicators appear when actual OG/FG/IBU deviate from style
- [x] 8.6 Restructure navigation: brew day at `/`, "Ferramentas" menu with the existing calculators, phase sections link to the relevant tool. Verify: opening a tool and returning keeps all brew day data
- [x] 8.7 Create src/components/SessionHistory.tsx: list sessions; opening one shows the brew day page with expected vs actual summary. Verify: completed sessions show OG, FG, ABV, IBU and efficiency comparison
- [x] 8.8 Create MaskedDecimalInput (configurable decimals) and apply to ABV (1 decimal) in recipe and style tool, and grain weight in kg (3 decimals) in recipe and mash tool; format programmatic values to the mask. Verify: "63" → 6.3, "5500" → 5.500 kg, "250" → 0.250 kg
- [x] 8.9 Add SRM/EBC color unit selector (stored in SRM, EBC = SRM × 1.97, preference in localStorage) applied to recipe color, style ranges, conformity badges and style tool. Verify: 21A shows 12–28 EBC; 16 EBC validates as within style; choice persists after reload
- [x] 8.10 Make grain potential (PPG) optional: empty by default with "37 (padrão)" placeholder, omitted values use 37. Verify: recipe with grain without potential saves and efficiency is calculated
- [x] 8.11 Backend: add kettle fit suggestion to calculators/mash.py and POST /api/calculate/mash (sparge_water_l input; redistribution keeping total water, 2.5 L/kg minimum, no-sparge case, pre-boil volume check). Verify: pytest covers all "Suggest water split to fit kettle" scenarios
- [x] 8.12 Frontend: show kettle suggestion with "Aplicar ajuste" in recipe "Volumes e equipamento" and in the mash tool. Verify: 20 L kettle, 5 kg grain, 18 L mash water suggests 16.6 L mash / +1.4 L sparge and applying updates the fields
- [x] 8.13 Move the SRM/EBC selector next to each color field and color range (ColorInput and style ranges), removing it from the app header; choice stays app-wide and remembered. Verify: switching beside the recipe color field converts field, style range and badges; choice persists after reload
- [x] 8.14 Backend: add preboil_volume_l and water_profile to Recipe model/schemas, and a startup migration that adds missing nullable columns to existing SQLite tables. Verify: current dev DB gains the columns keeping existing recipes and sessions; pytest covers the migration
- [x] 8.15 Frontend: "Água e volumes" block in the recipe parameters with mash water, sparge water, pre-boil volume (suggested value with "usar"), kettle adjustment suggestions and water profile with salts/acid for mash and sparge; Lauter phase expects the recipe pre-boil volume. Verify: "Suggested pre-boil volume", "Pre-boil volume drives adjustments" and "Salts for recipe volumes" scenarios
- [x] 8.16 Remove "OG pré-fervura" from recipe target inputs (RecipeForm), keeping only OG da mostura and OG (post-boil); update Lauter phase's expected pre-boil gravity to use recipe.og_mash instead of a dedicated og_preboil target. Verify: recipe form shows only two OG fields; Lauter phase still records actual pre-boil gravity readings, expected comes from og_mash
- [x] 8.17 Fix SRM/EBC selector alignment: move it from the field-label row into the field's unit slot (where "SG"/"kg"/"SRM" is shown today), in ColorInput and StyleRanges. Verify: color field and a sibling field (e.g. IBU) in the same grid row have aligned input boxes at 375px width; selector stays on one line
- [x] 8.18 Backend: add mash.recalculate_water(grain_kg, batch_size_l, dead_space_l, boil_off_rate_l_h, boil_time_min, kettle_capacity_l, ratio=3.0, sparging=True) composing strike_water/mash_volume/grain_absorption/sparge_water/check_kettle_fit, clamping ratio down to 2.5 L/kg to fit, BIAB full-volume method when sparging is disabled, falling back to the existing reduce-grain message when even the floor doesn't fit; expose via POST /api/calculate/mash. Verify: pytest covers all "Recalculate mash and sparge water from equipment" scenarios, including the 4.8kg/20L/20L-kettle case (14.4L mash / 21L pre-boil / 11.4L sparge)
- [x] 8.19 Frontend: add "Proporção água/malte" control (default 3, range 2.5–4, not persisted) and "Recalcular água" button as the primary action in "Água e volumes", filling mash water, sparge water and pre-boil volume from the recalculation; keep "Aplicar ajuste" as the secondary/fallback action. Verify: recalculating the Milk Stout-shaped example (4.8kg grain, 18L/13.72L typed, 20L kettle) replaces values with 14.4L/11.4L and no kettle warning remains

## 9. Data Persistence

- [x] 9.1 Implement recipe CRUD with SQLAlchemy in backend. Verify: recipes persist across server restart
- [x] 9.2 Implement session persistence with all readings. Verify: session data persists correctly
- [x] 9.3 Implement JSON export endpoint for sessions. Verify: exported file contains all session data

## 10. Docker & Deployment

- [x] 10.1 Create docker-compose.yml with backend and frontend services, named volume for data. Verify: `docker-compose config` validates
- [x] 10.2 Test full app in Docker: backend + frontend containers. Verify: data persists across container restarts
- [x] 10.3 Add README.md with setup instructions for local dev and Docker deployment. Verify: following README successfully runs the app
- [x] 10.4 Test docker-compose up from clean state. Verify: app accessible at localhost:3000, API at localhost:8000/docs
