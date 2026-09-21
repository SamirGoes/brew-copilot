# Spec Delta

## Purpose

Calcula parâmetros de mosturação incluindo volumes de água, proporções água/malte, e determina se o processo cabe na capacidade do equipamento disponível.

## ADDED Requirements

### Requirement: Calculate strike water volume
The system SHALL calculate the volume of strike water (água de mostura) based on the grain weight and desired water-to-grain ratio.

#### Scenario: Calculate strike water for standard mash
- **WHEN** user inputs 5kg of grain and 3:1 water-to-grain ratio
- **THEN** system returns 15 liters as the strike water volume

#### Scenario: Calculate strike water with custom ratio
- **WHEN** user inputs 4kg of grain and 2.5:1 water-to-grain ratio
- **THEN** system returns 10 liters as the strike water volume

### Requirement: Calculate total mash volume
The system SHALL calculate the total volume occupied by the mash (water + grain displacement) to determine equipment fit.

#### Scenario: Calculate mash volume including grain displacement
- **WHEN** user inputs 5kg of grain and 15 liters of strike water
- **THEN** system returns the total mash volume accounting for grain displacement (approximately 0.67L per kg of grain)

### Requirement: Validate kettle capacity
The system SHALL validate whether the calculated mash volume fits within the specified kettle capacity and warn if it exceeds.

#### Scenario: Mash fits in kettle
- **WHEN** total mash volume is 18 liters and kettle capacity is 25 liters
- **THEN** system confirms the mash fits with margin displayed

#### Scenario: Mash exceeds kettle capacity
- **WHEN** total mash volume is 28 liters and kettle capacity is 25 liters
- **THEN** system displays warning with overflow amount and suggests reducing grain or using multiple batches

### Requirement: Calculate sparge water volume
The system SHALL calculate the sparge (lavagem) water volume when batch sparging is enabled, based on target pre-boil volume minus first runnings.

#### Scenario: Calculate sparge water for batch sparge
- **WHEN** user enables sparging, target pre-boil volume is 25 liters, and estimated first runnings is 12 liters
- **THEN** system calculates sparge water as approximately 13 liters plus absorption losses

#### Scenario: No-sparge brewing (BIAB style)
- **WHEN** user disables sparging
- **THEN** system calculates only strike water with full volume method and does not show sparge calculations

### Requirement: Calculate grain absorption
The system SHALL calculate water lost to grain absorption using a standard absorption rate.

#### Scenario: Calculate absorption loss
- **WHEN** user inputs 5kg of grain
- **THEN** system calculates absorption loss at approximately 1L per kg of grain (5 liters total)
