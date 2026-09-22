# mash-calculator Specification

## Purpose
Calcula parâmetros de mosturação incluindo volumes de água, proporções água/malte, e determina se o processo cabe na capacidade do equipamento disponível.

## Requirements

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

### Requirement: Suggest water split to fit kettle
The system SHALL suggest how to redistribute water between mash and sparge when the mash volume (strike water plus grain displacement of 0.67 L/kg) exceeds the usable kettle capacity (in liters), keeping total water unchanged and the mash no thinner than 2.5 L/kg.

#### Scenario: Move water from mash to sparge
- **WHEN** kettle capacity is 20 liters, grain is 5kg, strike water is 18 liters and sparge water is 10 liters
- **THEN** system suggests reducing strike water to 16.6 liters and increasing sparge water to 11.4 liters, and offers to apply the adjustment

#### Scenario: Mash too thick to fit
- **WHEN** fitting the kettle would require less than 2.5 L/kg of strike water
- **THEN** system warns the mash cannot fit and suggests reducing grain or splitting the batch

#### Scenario: No-sparge mash overflows
- **WHEN** sparging is disabled and the mash volume exceeds kettle capacity
- **THEN** system suggests enabling sparging with the excess water moved to sparge

#### Scenario: Pre-boil volume exceeds kettle
- **WHEN** pre-boil volume is 24 liters and kettle capacity is 22 liters
- **THEN** system warns that 2 liters exceed the kettle and suggests reducing pre-boil volume and topping up with water after the boil

### Requirement: Recalculate mash and sparge water from equipment
The system SHALL derive mash water, sparge water and pre-boil volume from scratch — given grain weight, a water-to-grain ratio (default 3 L/kg, adjustable 2.5–4 L/kg), target batch size and equipment (kettle capacity, dead space, boil-off rate, boil time) — replacing any previously typed mash/sparge values, rather than only adjusting them reactively.

#### Scenario: Recalculate an oversized recipe to fit the kettle
- **WHEN** grain is 4.8kg, ratio is 3 L/kg (default), batch size is 20 liters, dead space is 0, boil-off rate is 1L/hour, boil time is 60 minutes, and kettle capacity is 20 liters
- **THEN** system suggests 14.4 liters mash water (mash volume 17.6L, fits with 2.4L margin), 21 liters pre-boil volume, and 11.4 liters sparge water — replacing values such as 18L mash + 13.72L sparge that would not fit

#### Scenario: Ratio clamped to fit the kettle
- **WHEN** the default ratio would still exceed kettle capacity
- **THEN** system lowers the ratio down to 2.5 L/kg to fit, and only if that is still not enough does it fall back to the "Suggest water split to fit kettle" warning (reduce grain or split the batch)

#### Scenario: No-sparge recalculation (BIAB)
- **WHEN** sparging is disabled
- **THEN** system computes mash water as pre-boil volume plus grain absorption (full volume method) and leaves sparge water empty
