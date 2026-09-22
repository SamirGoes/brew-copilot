# Spec Delta

## Purpose

Calcula o amargor (IBU) da cerveja com base no lúpulo utilizado e permite recalcular quantidades quando o tempo de fervura é ajustado.

## ADDED Requirements

### Requirement: Calculate IBU from hop additions
The system SHALL calculate International Bitterness Units (IBU) using the Tinseth formula based on hop weight, alpha acid percentage, boil time, batch volume, and wort gravity.

#### Scenario: Calculate IBU for single hop addition
- **WHEN** user inputs 30g of hops at 6% alpha acid, 60 minutes boil time, 20L batch, and 1.050 OG
- **THEN** system calculates and displays the IBU contribution (approximately 21 IBU with Tinseth)

#### Scenario: Calculate IBU for multiple hop additions
- **WHEN** user inputs 30g at 60min, 20g at 15min, and 10g at 0min (same or different hops)
- **THEN** system calculates individual contributions and total IBU

### Requirement: Support multiple IBU calculation formulas
The system SHALL support both Tinseth and Rager IBU calculation formulas with Tinseth as default.

#### Scenario: Switch to Rager formula
- **WHEN** user selects Rager formula in settings
- **THEN** system recalculates all IBU values using Rager formula

### Requirement: Recalculate hop amount for adjusted boil time
The system SHALL calculate the required hop quantity to achieve a target IBU when boil time changes from the original recipe.

#### Scenario: Shorter boil time requires more hops
- **WHEN** original recipe calls for 30g at 60min for 21 IBU, but user will boil for only 45min
- **THEN** system calculates new hop amount needed to achieve same 21 IBU (approximately 33g)

#### Scenario: Longer boil time allows less hops
- **WHEN** original recipe calls for 30g at 60min for 21 IBU, but user will boil for 90min
- **THEN** system calculates reduced hop amount to avoid exceeding target IBU (approximately 28g)

### Requirement: Calculate hop utilization
The system SHALL display hop utilization percentage based on boil time and gravity.

#### Scenario: Show utilization for 60 minute boil
- **WHEN** user views hop addition at 60 minutes with 1.050 gravity
- **THEN** system displays utilization percentage (approximately 23%)

#### Scenario: Show utilization decreases with higher gravity
- **WHEN** user compares 60 minute additions at 1.050 vs 1.080 gravity
- **THEN** system shows lower utilization for higher gravity wort

### Requirement: Display IBU to OG ratio
The system SHALL calculate and display the IBU:OG ratio (BU:GU) to help assess beer balance.

#### Scenario: Calculate BU:GU ratio
- **WHEN** beer has 35 IBU and OG of 1.050
- **THEN** system displays BU:GU ratio of 0.70 with indication of balance (malty/balanced/hoppy)

### Requirement: Track hop inventory per addition
The system SHALL track which hop variety is used for each addition with its specific alpha acid percentage.

#### Scenario: Record hop variety details
- **WHEN** user adds hop addition with variety "Cascade", alpha acid 5.5%, amount 30g
- **THEN** system stores all details and uses correct alpha acid for IBU calculation
