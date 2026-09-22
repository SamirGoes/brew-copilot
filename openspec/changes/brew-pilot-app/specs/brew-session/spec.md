# Spec Delta

## Purpose

Gerencia sessões de brassagem com acompanhamento por fases, mantendo histórico completo de valores planejados versus atingidos em cada etapa do processo.

## ADDED Requirements

### Requirement: Create and manage brew sessions
The system SHALL allow creating new brew sessions linked to a recipe, with unique identification and timestamps.

#### Scenario: Create new brew session
- **WHEN** user creates a new session with recipe name "IPA Teste"
- **THEN** system creates session with unique ID, timestamp, and links to recipe parameters

#### Scenario: List existing sessions
- **WHEN** user views session list
- **THEN** system displays all sessions with date, recipe name, and current phase

### Requirement: Track brewing phases
The system SHALL track the current phase of each session: Mash, Lauter, Boil, Cooling, Fermentation, Conditioning, Carbonation.

#### Scenario: Advance to next phase
- **WHEN** user completes mash phase and advances
- **THEN** system records mash completion time and moves session to Lauter phase

#### Scenario: Record phase-specific data
- **WHEN** user is in Boil phase
- **THEN** system shows and allows input of boil-specific parameters (hop additions, boil time, gravity readings)

### Requirement: Store expected vs actual values per phase
The system SHALL store both the expected (from recipe) and actual (measured) values for each parameter in each phase.

#### Scenario: Record actual value alongside expected
- **WHEN** recipe expects OG of 1.052 and user records actual OG of 1.048
- **THEN** system stores both values with deviation calculation

#### Scenario: View historical comparison
- **WHEN** user views completed session
- **THEN** system displays side-by-side comparison of expected vs actual for all parameters

### Requirement: Track fermentation progress
The system SHALL track fermentation with gravity readings, temperature, and duration.

#### Scenario: Log fermentation gravity reading
- **WHEN** user logs gravity reading of 1.020 on day 5 of fermentation
- **THEN** system records the reading with timestamp and calculates current attenuation

#### Scenario: Detect fermentation completion
- **WHEN** three consecutive gravity readings are stable (within 0.001)
- **THEN** system suggests fermentation may be complete

### Requirement: Track carbonation
The system SHALL calculate carbonation levels and track conditioning/carbonation phase.

#### Scenario: Calculate priming sugar
- **WHEN** user inputs 20L batch, target 2.4 volumes CO2, and beer temperature of 20C
- **THEN** system calculates grams of dextrose or table sugar needed

#### Scenario: Calculate force carbonation pressure
- **WHEN** user selects force carbonation, inputs target 2.4 volumes CO2, and fridge temp of 4C
- **THEN** system calculates required PSI for carbonation

### Requirement: Persist session data locally
The system SHALL persist all session data locally so it survives browser refresh and system restart.

#### Scenario: Resume session after browser close
- **WHEN** user closes browser mid-session and reopens application
- **THEN** system restores session with all previously recorded data

#### Scenario: Export session data
- **WHEN** user requests session export
- **THEN** system exports session as JSON file with all parameters and readings

### Requirement: Display session summary
The system SHALL display a summary view of completed sessions showing key metrics and deviations.

#### Scenario: View session summary
- **WHEN** session is complete
- **THEN** system displays: actual vs expected OG, FG, ABV, IBU, efficiency, and notes on major deviations

### Requirement: Single-page brew day
The system SHALL provide a single brew day page where the user selects the style, fills the recipe parameters, and records actual values for every phase, all on the same screen.

#### Scenario: Compare recipe against style before brewing
- **WHEN** user selects "American IPA (21A)" and fills OG 1.060, FG 1.012, IBU 75, SRM 8, ABV 6.3
- **THEN** page shows each parameter with the style range and conformity indicator, plus the "X/5 within style" summary

#### Scenario: Record phase values on the same page
- **WHEN** user records mash values and advances to Lauter
- **THEN** mash values (expected, actual, deviation) remain visible on the page and the Lauter section becomes active

#### Scenario: Resume brew day
- **WHEN** user reopens the application during an unfinished session
- **THEN** the brew day page restores style, recipe parameters and all recorded phase values

### Requirement: Calculators as tools
The system SHALL keep the standalone calculators (mash, gravity, hops, water, styles) available as tools, accessible from the brew day page without losing the session data.

#### Scenario: Open a tool during the brew day
- **WHEN** user is in the Boil phase and opens the Hops tool
- **THEN** the tool opens and returning to the brew day page shows all data unchanged
