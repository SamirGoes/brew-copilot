# Spec Delta

## Purpose

Fornece biblioteca de estilos BJCP com validação visual de conformidade, alertando quando parâmetros da receita ou valores atingidos estão fora das faixas definidas pelo estilo.

## ADDED Requirements

### Requirement: Load BJCP style database
The system SHALL load the BJCP style guidelines from a bundled JSON file containing all styles with their vital statistics (OG, FG, IBU, SRM, ABV ranges).

#### Scenario: Load styles on startup
- **WHEN** application starts
- **THEN** system loads all BJCP styles and makes them available for selection

#### Scenario: Search styles by name
- **WHEN** user types "IPA" in style search
- **THEN** system filters and displays all styles containing "IPA" in name or category

### Requirement: Select style for recipe
The system SHALL allow selecting a BJCP style for a recipe, storing the style reference and its parameter ranges.

#### Scenario: Select style for new recipe
- **WHEN** user selects "American IPA (21A)" as target style
- **THEN** system stores style reference and displays target ranges: OG 1.056-1.070, FG 1.008-1.014, IBU 40-70, SRM 6-14, ABV 5.5-7.5%

#### Scenario: Auto-fill targets from style
- **WHEN** user selects a style and clicks "Use style defaults"
- **THEN** system fills recipe targets with midpoint values of the style ranges

### Requirement: Validate recipe against style
The system SHALL validate each recipe parameter against the selected style's ranges and display conformity status.

#### Scenario: Parameter within range - green indicator
- **WHEN** recipe OG target is 1.060 and style range is 1.056-1.070
- **THEN** system displays OG with green indicator (within style)

#### Scenario: Parameter slightly outside range - orange indicator
- **WHEN** recipe IBU target is 75 and style range is 40-70 (deviation up to 15%)
- **THEN** system displays IBU with orange indicator and shows "+7% above style max"

#### Scenario: Parameter significantly outside range - red indicator
- **WHEN** recipe OG target is 1.090 and style range is 1.056-1.070 (deviation over 15%)
- **THEN** system displays OG with red indicator and shows "+29% above style max"

### Requirement: Display style conformity summary
The system SHALL display an overall conformity summary showing how many parameters are within, slightly outside, or significantly outside the style guidelines.

#### Scenario: Show conformity summary
- **WHEN** user views recipe with style selected
- **THEN** system displays summary like "4/5 within style, 1 slightly outside (IBU)"

#### Scenario: Show conformity badge
- **WHEN** all recipe parameters are within style ranges
- **THEN** system displays "BJCP Compliant" badge in green

### Requirement: Validate actual vs style during session
The system SHALL also validate actual achieved values against style ranges during brewing session, using the same color-coded indicators.

#### Scenario: Actual OG outside style
- **WHEN** achieved OG is 1.048 and style minimum is 1.056
- **THEN** system displays actual OG with orange indicator and shows "-14% below style min"

#### Scenario: Compare expected, actual, and style
- **WHEN** viewing a parameter during session
- **THEN** system displays three values: recipe target, actual measured, and style range, with indicators for each comparison

### Requirement: Display style description
The system SHALL display the full BJCP style description including aroma, appearance, flavor, mouthfeel, and brewing tips.

#### Scenario: View style details
- **WHEN** user clicks on style name or info icon
- **THEN** system displays modal/panel with full style description, commercial examples, and characteristic ingredients

### Requirement: Show deviation magnitude
The system SHALL show the exact deviation percentage or absolute value when a parameter is outside the style range.

#### Scenario: Show deviation below minimum
- **WHEN** recipe FG is 1.006 and style minimum is 1.008
- **THEN** system shows "0.002 below min" or "-25% below min"

#### Scenario: Show deviation above maximum
- **WHEN** recipe ABV is 8.0% and style maximum is 7.5%
- **THEN** system shows "0.5% above max" or "+7% above max"

### Requirement: Display color in SRM or EBC
The system SHALL let the user choose the color unit (SRM or EBC) with a selector placed next to each color field and color range (not in the app header), without changing the field's height or position relative to sibling fields. Color values are stored in SRM and converted for display and input using EBC = SRM × 1.97. The choice applies app-wide (recipe, style ranges, conformity badges, style tool) and is remembered on the device.

#### Scenario: Show style range in EBC
- **WHEN** user selects EBC and views "American IPA (21A)"
- **THEN** system displays the color range as 12–28 EBC

#### Scenario: Input color in EBC
- **WHEN** user has EBC selected and inputs recipe color 16
- **THEN** system stores 8.1 SRM and validates it as within the style range

#### Scenario: Switch unit beside the field
- **WHEN** user switches to EBC using the selector next to the recipe color field
- **THEN** the field, the style color range and the conformity badges are converted to EBC

#### Scenario: Selector does not break field alignment
- **WHEN** the color field sits beside another field in the same row (e.g. IBU) on any screen width, including mobile
- **THEN** both fields' input boxes stay aligned at the same height, and the unit selector stays on a single line

#### Scenario: Remember color unit
- **WHEN** user selects EBC and reopens the application
- **THEN** color values are still displayed in EBC
