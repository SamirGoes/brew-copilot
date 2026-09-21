# Tasks

## 1. Project Setup - Backend

- [x] 1.1 Create backend/ directory with pyproject.toml (name: brew-copilot-backend, Python 3.12). Verify: `pip install -e .` succeeds
- [x] 1.2 Add dependencies: fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings. Verify: imports work in Python REPL
- [x] 1.3 Create directory structure: app/, app/models/, app/schemas/, app/calculators/, app/routers/, app/data/. Verify: all directories exist
- [x] 1.4 Download BJCP styles.json from https://github.com/ascholer/bjcp-styleview and save to app/data/styles.json. Verify: file exists and loads as valid JSON
- [ ] 1.5 Create backend/Dockerfile with Python 3.12-slim, uvicorn entrypoint. Verify: `docker build` succeeds

## 2. Project Setup - Frontend

- [x] 2.1 Create frontend/ with Vite + React + TypeScript: `npm create vite@latest frontend -- --template react-ts`. Verify: `npm run dev` starts on port 5173
- [x] 2.2 Install additional dependencies: axios (API client). Verify: `npm install` succeeds
- [x] 2.3 Create directory structure: src/api/, src/components/, src/hooks/, src/types/, src/styles/. Verify: all directories exist
- [ ] 2.4 Create frontend/Dockerfile with multi-stage build (node build + nginx). Verify: `docker build` succeeds
- [ ] 2.5 Create nginx.conf with proxy to backend /api/. Verify: config is valid

## 3. Database Setup

- [x] 3.1 Create app/database.py with SQLAlchemy engine, sessionmaker, Base. Verify: can create in-memory test DB
- [x] 3.2 Create app/models/recipe.py with Recipe, Grain, HopAddition models. Verify: models create tables correctly
- [x] 3.3 Create app/models/session.py with BrewSession, SessionReading models. Verify: models create tables correctly
- [x] 3.4 Create app/schemas/ with Pydantic schemas for all models. Verify: schemas validate sample data

## 4. Calculator Modules

- [x] 4.1 Implement app/calculators/mash.py with strike_water, mash_volume, grain_absorption, sparge_water functions. Verify: pytest tests pass for all scenarios in mash-calculator spec
- [x] 4.2 Implement app/calculators/gravity.py with sg_to_plato, plato_to_sg, efficiency, water_adjustment functions. Verify: pytest tests pass for all scenarios in gravity-tracker spec
- [ ] 4.3 Implement app/calculators/hops.py with tinseth_ibu, utilization, recalculate_hops functions. Verify: pytest tests pass for all scenarios in hop-calculator spec
- [x] 4.4 Implement app/calculators/water.py with calculate_salts, calculate_acid functions for 3 profiles. Verify: pytest tests pass for all scenarios in water-chemistry spec
- [x] 4.5 Implement app/calculators/carbonation.py with priming_sugar, force_carb_psi functions. Verify: pytest tests pass for carbonation scenarios in brew-session spec
- [ ] 4.6 Implement app/calculators/style_validator.py with load_styles, validate_params, deviation_severity functions. Verify: pytest tests pass for all scenarios in style-guidelines spec

## 5. API Routes

- [ ] 5.1 Create app/main.py with FastAPI app, CORS middleware (allow localhost:5173), include routers. Verify: `uvicorn app.main:app` starts on port 8000, /docs shows Swagger UI
- [ ] 5.2 Implement app/routers/calculate.py with POST endpoints /mash, /gravity, /hops, /water. Verify: curl/httpie requests return correct calculations
- [ ] 5.3 Implement app/routers/recipes.py with CRUD endpoints. Verify: can create, read, update, delete recipes via API
- [ ] 5.4 Implement app/routers/sessions.py with CRUD, phase advancement, reading registration. Verify: can create session, advance phases, record readings
- [ ] 5.5 Implement app/routers/styles.py with GET /styles, GET /styles/{id}, POST /validate/style. Verify: curl requests return styles and validation results

## 6. Frontend - Base Structure

- [ ] 6.1 Create src/api/client.ts with axios instance, typed functions for all API endpoints. Verify: TypeScript compiles without errors
- [ ] 6.2 Create src/types/index.ts with TypeScript interfaces matching backend Pydantic schemas. Verify: types match API responses
- [ ] 6.3 Create src/App.tsx with React Router, navigation between calculator views. Verify: navigation works in browser
- [ ] 6.4 Create src/styles/main.css with mobile-first responsive design, large touch targets. Verify: UI usable on mobile viewport (375px)

## 7. Frontend - Calculator Components

- [ ] 7.1 Create src/components/MashCalculator.tsx: grain weight, water ratio, kettle capacity, sparge toggle. Verify: inputs calculate and display results matching spec scenarios
- [ ] 7.2 Create src/components/GravityTracker.tsx: gravity inputs per phase, expected vs actual comparison. Verify: displays deviations and water adjustment calculations
- [ ] 7.3 Create src/components/HopCalculator.tsx: hop additions table, IBU display, time adjustment. Verify: changing boil time recalculates hop amounts
- [ ] 7.4 Create src/components/WaterChemistry.tsx: profile selector, volume inputs, salt/acid results. Verify: changing profile updates calculations instantly
- [ ] 7.5 Create src/components/StyleSelector.tsx: searchable dropdown, style details modal. Verify: can search and select styles, view full BJCP description
- [ ] 7.6 Create src/components/ConformityBadge.tsx: green/orange/red indicators with deviation %. Verify: indicators update in real-time as values change
- [ ] 7.7 Create conformity summary component showing "X/5 within style" with parameter list. Verify: summary accurately reflects all validations

## 8. Frontend - Session Management

- [ ] 8.1 Create src/components/RecipeForm.tsx: grain bill, hops, targets, equipment params. Verify: can save and load complete recipe
- [ ] 8.2 Create src/components/SessionView.tsx: session creation from recipe, phase tracking. Verify: new session shows first phase (Mash) with expected values
- [ ] 8.3 Implement phase progression UI with actual value input and deviation display. Verify: advancing phase records data and shows next phase
- [ ] 8.4 Create src/components/SessionHistory.tsx: list and summary view. Verify: completed sessions show expected vs actual comparison
- [ ] 8.5 Implement style validation in session view for actual achieved values. Verify: red/orange indicators appear when actual OG/FG/IBU deviate from style

## 9. Data Persistence

- [ ] 9.1 Implement recipe CRUD with SQLAlchemy in backend. Verify: recipes persist across server restart
- [ ] 9.2 Implement session persistence with all readings. Verify: session data persists correctly
- [ ] 9.3 Implement JSON export endpoint for sessions. Verify: exported file contains all session data

## 10. Docker & Deployment

- [ ] 10.1 Create docker-compose.yml with backend and frontend services, named volume for data. Verify: `docker-compose config` validates
- [ ] 10.2 Test full app in Docker: backend + frontend containers. Verify: data persists across container restarts
- [ ] 10.3 Add README.md with setup instructions for local dev and Docker deployment. Verify: following README successfully runs the app
- [ ] 10.4 Test docker-compose up from clean state. Verify: app accessible at localhost:3000, API at localhost:8000/docs
