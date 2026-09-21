# Spec Delta

## Purpose

Registra e compara medições de gravidade em cada fase da brassagem, calculando eficiência e correções necessárias para atingir a gravidade alvo.

## ADDED Requirements

### Requirement: Record gravity readings at each phase
The system SHALL allow recording of gravity readings (in specific gravity or Plato) at each brewing phase: mash, pre-boil, post-boil, and fermentation end.

#### Scenario: Record mash gravity
- **WHEN** user inputs mash gravity reading of 1.045
- **THEN** system stores the value and displays it alongside the expected target

#### Scenario: Record pre-boil gravity
- **WHEN** user inputs pre-boil gravity of 1.038 and pre-boil volume of 28 liters
- **THEN** system stores both values and calculates expected post-boil gravity

#### Scenario: Record final gravity
- **WHEN** user inputs original gravity (OG) of 1.052 and final gravity (FG) of 1.012
- **THEN** system calculates and displays apparent attenuation and ABV

### Requirement: Compare expected vs actual gravity
The system SHALL display the difference between expected and actual gravity readings with clear visual indication of deviation.

#### Scenario: Gravity matches target
- **WHEN** expected OG is 1.050 and actual OG is 1.049
- **THEN** system shows deviation of -0.001 with neutral/positive indicator

#### Scenario: Gravity below target
- **WHEN** expected OG is 1.050 and actual OG is 1.040
- **THEN** system shows deviation of -0.010 with warning indicator and suggests corrections

### Requirement: Calculate water adjustment for OG correction
The system SHALL calculate how much water to add or boil off to achieve target OG after boil.

#### Scenario: OG too high - add water
- **WHEN** actual post-boil OG is 1.060, target OG is 1.052, and current volume is 20 liters
- **THEN** system calculates liters of water to add to reach target OG

#### Scenario: OG too low - extend boil
- **WHEN** actual post-boil OG is 1.045, target OG is 1.052, and current volume is 22 liters
- **THEN** system calculates liters to boil off or suggests adding fermentables

### Requirement: Calculate brewing efficiency
The system SHALL calculate mash efficiency and brewhouse efficiency based on gravity readings and grain bill.

#### Scenario: Calculate mash efficiency
- **WHEN** user inputs 5kg of grain with potential of 37 PPG, actual pre-boil gravity of 1.040, and volume of 28 liters
- **THEN** system calculates and displays mash efficiency percentage

#### Scenario: Calculate brewhouse efficiency
- **WHEN** user inputs grain bill, OG of 1.052, and final volume of 20 liters into fermenter
- **THEN** system calculates and displays overall brewhouse efficiency

### Requirement: Support gravity unit conversion
The system SHALL convert between specific gravity (SG) and degrees Plato automatically.

#### Scenario: Convert SG to Plato
- **WHEN** user inputs gravity as 1.050 SG
- **THEN** system displays equivalent in Plato (approximately 12.4 P)

#### Scenario: Input in Plato
- **WHEN** user inputs gravity as 12 Plato
- **THEN** system converts and stores as SG (approximately 1.048)
