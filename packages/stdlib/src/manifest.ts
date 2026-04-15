/**
 * @sysml/stdlib - Standard Library Manifest
 *
 * Defines the complete list of standard library files and their dependency order.
 * Based on the SysML v2 specification standard library.
 */

/**
 * Standard library files organized in dependency layers.
 * Files in earlier layers must be loaded before files in later layers.
 *
 * Layer 0: Core KerML foundations (no dependencies)
 * Layer 1: KerML core types and functions
 * Layer 2: KerML advanced types
 * Layer 3: SysML core definitions
 * Layer 4: SysML domain-specific libraries
 * Layer 5: SysML advanced features
 * Layer 6: ISQ (International System of Quantities)
 * Layer 7: SI and measurement units
 */
export const STDLIB_DEPENDENCY_LAYERS: readonly (readonly string[])[] = [
    // Layer 0: KerML foundations
    [
        'KerML.kerml',
        'Base.kerml',
    ],
    // Layer 1: KerML core types and functions
    [
        'ScalarValues.kerml',
        'BaseFunctions.kerml',
        'DataFunctions.kerml',
        'IntegerFunctions.kerml',
        'NaturalFunctions.kerml',
        'RealFunctions.kerml',
        'RationalFunctions.kerml',
        'ComplexFunctions.kerml',
        'NumericalFunctions.kerml',
        'BooleanFunctions.kerml',
        'StringFunctions.kerml',
        'ScalarFunctions.kerml',
        'ControlFunctions.kerml',
        'CollectionFunctions.kerml',
        'SequenceFunctions.kerml',
        'TrigFunctions.kerml',
        'VectorFunctions.kerml',
    ],
    // Layer 2: KerML advanced types
    [
        'Collections.kerml',
        'Links.kerml',
        'Objects.kerml',
        'Metaobjects.kerml',
        'Occurrences.kerml',
        'OccurrenceFunctions.kerml',
        'Performances.kerml',
        'ControlPerformances.kerml',
        'FeatureReferencingPerformances.kerml',
        'StatePerformances.kerml',
        'TransitionPerformances.kerml',
        'Transfers.kerml',
        'Clocks.kerml',
        'Observation.kerml',
        'SpatialFrames.kerml',
        'Triggers.kerml',
        'VectorValues.kerml',
    ],
    // Layer 3: SysML core
    [
        'SysML.sysml',
        'Parts.sysml',
        'Items.sysml',
        'Attributes.sysml',
        'Connections.sysml',
        'Interfaces.sysml',
        'Ports.sysml',
        'Actions.sysml',
        'States.sysml',
        'Calculations.sysml',
        'Constraints.sysml',
        'Requirements.sysml',
        'Cases.sysml',
        'UseCases.sysml',
        'VerificationCases.sysml',
        'AnalysisCases.sysml',
        'Views.sysml',
        'Metadata.sysml',
        'Flows.sysml',
        'Allocations.sysml',
    ],
    // Layer 4: SysML domain-specific
    [
        'CausationConnections.sysml',
        'CauseAndEffect.sysml',
        'DerivationConnections.sysml',
        'RequirementDerivation.sysml',
        'Quantities.sysml',
        'MeasurementReferences.sysml',
        'QuantityCalculations.sysml',
        'MeasurementRefCalculations.sysml',
        'TensorCalculations.sysml',
        'VectorCalculations.sysml',
        'TradeStudies.sysml',
        'ModelingMetadata.sysml',
        'RiskMetadata.sysml',
        'ParametersOfInterestMetadata.sysml',
        'AnalysisTooling.sysml',
        'ImageMetadata.sysml',
    ],
    // Layer 5: SysML advanced features
    [
        'SampledFunctions.sysml',
        'StateSpaceRepresentation.sysml',
        'StandardViewDefinitions.sysml',
        'ShapeItems.sysml',
        'SpatialItems.sysml',
        'Time.sysml',
    ],
    // Layer 6: ISQ libraries
    [
        'ISQBase.sysml',
        'ISQSpaceTime.sysml',
        'ISQMechanics.sysml',
        'ISQThermodynamics.sysml',
        'ISQElectromagnetism.sysml',
        'ISQLight.sysml',
        'ISQAcoustics.sysml',
        'ISQAtomicNuclear.sysml',
        'ISQChemistryMolecular.sysml',
        'ISQCondensedMatter.sysml',
        'ISQInformation.sysml',
        'ISQCharacteristicNumbers.sysml',
        'ISQ.sysml',
    ],
    // Layer 7: Units
    [
        'SI.sysml',
        'SIPrefixes.sysml',
        'USCustomaryUnits.sysml',
    ],
];

/**
 * Flattened list of all stdlib files in dependency order.
 */
export const STDLIB_FILES: readonly string[] = STDLIB_DEPENDENCY_LAYERS.flat();

/**
 * Get the total number of stdlib files.
 */
export function getStdlibFileCount(): number {
    return STDLIB_FILES.length;
}
