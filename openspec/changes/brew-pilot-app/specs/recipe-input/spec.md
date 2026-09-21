# Spec Delta

## Purpose

Permite a entrada dos parâmetros da receita e valores esperados que serão usados como referência durante a sessão de brassagem.

## ADDED Requirements

### Requirement: Input grain bill
The system SHALL allow input of grain bill with type, weight, and potential extract for each grain.

#### Scenario: Add base malt
- **WHEN** user adds "Pilsen" malt with 5kg weight
- **THEN** system stores the grain entry and updates total grain weight

#### Scenario: Add multiple grains
- **WHEN** user adds base malt and specialty grains
- **THEN** system displays complete grain bill with percentages and total weight

### Requirement: Input target gravities
The system SHALL allow input of expected gravity targets: OG mash, OG pre-boil, OG final, and FG.

#### Scenario: Set target OG
- **WHEN** user inputs target OG of 1.052
- **THEN** system stores the value as reference for the session

#### Scenario: Set target FG
- **WHEN** user inputs target FG of 1.012
- **THEN** system stores the value and calculates expected ABV and attenuation

### Requirement: Input hop schedule
The system SHALL allow input of hop additions with variety, weight, alpha acid percentage, and boil time.

#### Scenario: Add bittering hop
- **WHEN** user adds 30g Magnum at 12% AA for 60 minutes
- **THEN** system calculates and displays IBU contribution

#### Scenario: Add multiple hop additions
- **WHEN** user adds hops at 60min, 15min, and 0min
- **THEN** system displays full hop schedule with individual and total IBU

### Requirement: Input water volumes
The system SHALL allow input of mash water volume, sparge water volume (if applicable), and target batch size.

#### Scenario: Set mash volume
- **WHEN** user inputs 15L mash water
- **THEN** system stores value and uses it for mash calculations

#### Scenario: Enable or disable sparging
- **WHEN** user toggles sparging off (BIAB style)
- **THEN** system hides sparge-related inputs and adjusts calculations

### Requirement: Input equipment parameters
The system SHALL allow input of equipment parameters: kettle capacity, boil-off rate, dead space.

#### Scenario: Set kettle capacity
- **WHEN** user inputs 30L kettle capacity
- **THEN** system uses value to validate mash volume fits

#### Scenario: Set boil-off rate
- **WHEN** user inputs 4L/hour boil-off rate
- **THEN** system uses value to calculate post-boil volume

### Requirement: Input fermentation parameters
The system SHALL allow input of yeast strain, fermentation temperature target, and expected attenuation.

#### Scenario: Set yeast parameters
- **WHEN** user inputs US-05 yeast with 75% expected attenuation at 18C
- **THEN** system stores parameters and calculates expected FG from OG

### Requirement: Save and load recipes
The system SHALL persist recipes locally and allow loading saved recipes into new sessions.

#### Scenario: Save recipe
- **WHEN** user saves recipe with name "Session IPA"
- **THEN** system persists all recipe parameters locally

#### Scenario: Load saved recipe
- **WHEN** user selects "Session IPA" from saved recipes
- **THEN** system populates all input fields with saved values

### Requirement: Validate recipe inputs
The system SHALL validate inputs and warn about potential issues (e.g., mash volume exceeds kettle).

#### Scenario: Warn on kettle overflow
- **WHEN** calculated mash volume exceeds kettle capacity
- **THEN** system displays warning before proceeding

#### Scenario: Warn on missing required fields
- **WHEN** user tries to start session without grain bill
- **THEN** system prompts to complete required fields
