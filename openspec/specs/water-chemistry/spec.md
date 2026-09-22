# water-chemistry Specification

## Purpose
Calcula a dosagem de sais minerais (CaSO₄, MgSO₄, CaCl) e ácido ascórbico para ajustar o perfil da água de acordo com o estilo de cerveja desejado.

## Requirements

### Requirement: Support water profile presets
The system SHALL provide predefined water profiles: Lúpulo/Amargor, Maltosidade, and Equilibrada, each with specific salt ratios per 10L.

#### Scenario: Select hoppy profile
- **WHEN** user selects "Lúpulo/Amargor" profile
- **THEN** system uses base ratios: CaSO₄ 3.7g, MgSO₄ 0.9g, CaCl 0.8g per 10L

#### Scenario: Select malty profile
- **WHEN** user selects "Maltosidade" profile
- **THEN** system uses base ratios: CaSO₄ 0.1g, MgSO₄ 0.9g, CaCl 3.9g per 10L

#### Scenario: Select balanced profile
- **WHEN** user selects "Equilibrada" profile
- **THEN** system uses base ratios: CaSO₄ 2.0g, MgSO₄ 0.8g, CaCl 2.3g per 10L

### Requirement: Calculate salt amounts by volume
The system SHALL calculate salt quantities by scaling the base 10L ratios to the actual mash and sparge water volumes.

#### Scenario: Calculate salts for mash water
- **WHEN** user inputs 13L mash volume with "Maltosidade" profile
- **THEN** system calculates: CaSO₄ = 0.13g, MgSO₄ = 1.17g, CaCl = 5.07g

#### Scenario: Calculate salts for sparge water
- **WHEN** user inputs 17L sparge volume with "Maltosidade" profile
- **THEN** system calculates: CaSO₄ = 0.17g, MgSO₄ = 1.53g, CaCl = 6.63g

### Requirement: Calculate ascorbic acid drops
The system SHALL calculate ascorbic acid dosage at a rate of 5 drops per 10L, providing a range (floor to ceiling).

#### Scenario: Calculate ascorbic acid for mash
- **WHEN** user inputs 13L mash volume
- **THEN** system displays ascorbic acid as "6-7 drops"

#### Scenario: Calculate ascorbic acid for sparge
- **WHEN** user inputs 17L sparge volume
- **THEN** system displays ascorbic acid as "8-9 drops"

### Requirement: Display reference table
The system SHALL display a reference table showing base salt amounts per 10L for all profiles.

#### Scenario: View reference table
- **WHEN** user views the water chemistry calculator
- **THEN** system displays a table with all three profiles and their CaSO₄, MgSO₄, CaCl values per 10L

### Requirement: Real-time recalculation
The system SHALL recalculate all salt and acid amounts immediately when volume or profile inputs change.

#### Scenario: Update on volume change
- **WHEN** user changes mash volume from 13L to 15L
- **THEN** system immediately recalculates and displays updated salt amounts

#### Scenario: Update on profile change
- **WHEN** user switches profile from "Maltosidade" to "Lúpulo/Amargor"
- **THEN** system immediately recalculates and displays updated salt amounts for both mash and sparge
