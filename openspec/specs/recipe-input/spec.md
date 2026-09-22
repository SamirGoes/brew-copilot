# recipe-input Specification

## Purpose
Permite a entrada dos parâmetros da receita e valores esperados que serão usados como referência durante a sessão de brassagem.

## Requirements

### Requirement: Input grain bill
The system SHALL allow input of grain bill with type and weight for each grain; potential extract is optional and defaults to 37 PPG when unknown.

#### Scenario: Add base malt
- **WHEN** user adds "Pilsen" malt with 5kg weight
- **THEN** system stores the grain entry and updates total grain weight

#### Scenario: Grain without potential extract
- **WHEN** user adds "Pilsen" with 5kg and leaves potential extract empty
- **THEN** system accepts the grain and uses 37 PPG in efficiency calculations

#### Scenario: Add multiple grains
- **WHEN** user adds base malt and specialty grains
- **THEN** system displays complete grain bill with percentages and total weight

### Requirement: Input target gravities
The system SHALL allow input of expected gravity targets: OG mash and OG final (post-boil, used at pitching), and FG. OG mash and pre-boil gravity are treated as the same value, so no separate pre-boil target is collected.

#### Scenario: Set target OG
- **WHEN** user inputs target OG of 1.052
- **THEN** system stores the value as reference for the session

#### Scenario: Set target FG
- **WHEN** user inputs target FG of 1.012
- **THEN** system stores the value and calculates expected ABV and attenuation

### Requirement: Input style comparison targets
The system SHALL allow input of the recipe's target IBU, SRM and ABV, stored alongside OG and FG, so the recipe can be compared against the selected style.

#### Scenario: Set comparison targets
- **WHEN** user inputs IBU 75, SRM 8 and ABV 6.3 for the recipe
- **THEN** system stores the values and validates them against the selected style

### Requirement: Masked ABV and grain weight inputs
The system SHALL provide digit-only masked inputs for ABV (one decimal place) and grain weight in kg (three decimal places, digits are grams), in the recipe and in the mash tool. Hop weight in grams keeps free numeric input.

#### Scenario: Type ABV without the decimal point
- **WHEN** user types "63" in the ABV field
- **THEN** field displays "6.3" and stores 6.3

#### Scenario: Type grain weight in grams
- **WHEN** user types "5500" in a grain weight field
- **THEN** field displays "5.500" kg and stores 5.5

#### Scenario: Small grain weight
- **WHEN** user types "250" in a grain weight field
- **THEN** field displays "0.250" kg and stores 0.25

### Requirement: Input hop schedule
The system SHALL allow input of hop additions with variety, weight, alpha acid percentage, and boil time.

#### Scenario: Add bittering hop
- **WHEN** user adds 30g Magnum at 12% AA for 60 minutes
- **THEN** system calculates and displays IBU contribution

#### Scenario: Add multiple hop additions
- **WHEN** user adds hops at 60min, 15min, and 0min
- **THEN** system displays full hop schedule with individual and total IBU

### Requirement: Input water volumes
The system SHALL allow input of mash water volume, sparge water volume (if applicable), pre-boil volume and target batch size among the main recipe parameters, with kettle adjustment suggestions shown next to these fields.

#### Scenario: Set mash volume
- **WHEN** user inputs 15L mash water
- **THEN** system stores value and uses it for mash calculations

#### Scenario: Enable or disable sparging
- **WHEN** user toggles sparging off (BIAB style)
- **THEN** system hides sparge-related inputs and adjusts calculations

#### Scenario: Suggested pre-boil volume
- **WHEN** batch size is 20L, dead space is 1L, boil-off rate is 4L/hour and boil time is 60 minutes
- **THEN** system suggests 25L pre-boil volume with an option to use it, and the field remains editable

#### Scenario: Pre-boil volume drives adjustments
- **WHEN** user changes the pre-boil volume
- **THEN** system immediately recalculates the kettle check and adjustment suggestions shown next to the volumes, and uses the value as the expected pre-boil volume in the Lauter phase

#### Scenario: Recalculate water from equipment
- **WHEN** user sets a water-to-grain ratio (default 3 L/kg, adjustable 2.5–4 L/kg) and clicks "Recalcular água"
- **THEN** system replaces mash water, sparge water and pre-boil volume with values derived from grain weight, the ratio, and the equipment (see mash-calculator: "Recalculate mash and sparge water from equipment"); the ratio itself is a form control and is not saved with the recipe

### Requirement: Water salt correction in recipe
The system SHALL let the user choose a water profile (Lúpulo/Amargor, Maltosidade, Equilibrada) in the recipe parameters and show the salt and ascorbic acid amounts for the recipe's mash and sparge water volumes, recalculating when volumes or profile change. The profile is saved with the recipe.

#### Scenario: Salts for recipe volumes
- **WHEN** recipe has 13L mash water and 17L sparge water with "Maltosidade" profile
- **THEN** system displays CaSO₄ 0.13g / 0.17g, MgSO₄ 1.17g / 1.53g, CaCl 5.07g / 6.63g and ascorbic acid "6-7 drops" / "8-9 drops" for mash / sparge

#### Scenario: Profile saved with recipe
- **WHEN** user selects "Lúpulo/Amargor" and reloads the recipe
- **THEN** the profile is still selected and salts are shown for the current volumes

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

#### Scenario: Load saved recipe into brew day
- **WHEN** user starts a brew day and selects "Session IPA"
- **THEN** the brew day page fills style and recipe parameters from the saved recipe and uses them as expected values for each phase

### Requirement: Validate recipe inputs
The system SHALL validate inputs and warn about potential issues (e.g., mash volume exceeds kettle).

#### Scenario: Warn on kettle overflow
- **WHEN** calculated mash volume exceeds kettle capacity
- **THEN** system displays warning before proceeding, with the suggested mash/sparge water adjustment (see mash-calculator) and an option to apply it

#### Scenario: Warn on missing required fields
- **WHEN** user tries to start session without grain bill
- **THEN** system prompts to complete required fields
