export type SurfaceType = 'Jardín' | 'Patio' | 'Terraza' | 'Balcón' | 'Ninguno';

export interface PropertyCharacteristics {
    // Indispensable
    rooms?: number;           // Ambientes
    bedrooms?: number;        // Dormitorios
    bathrooms?: number;       // Baños
    age?: number;             // Antigüedad (years)
    garage?: boolean;         // Cochera

    // Optional
    semiCoveredSurface?: number; // Superficie semicubierta
    toilettes?: number;
    floorType?: string;       // Pisos de la propiedad
    apartmentsInBuilding?: number; // Deptos. en el edificio
    isCreditEligible?: boolean;    // Apto crédito
    isProfessional?: boolean;      // Apto profesional
    hasFinancing?: boolean;        // Ofrece financiamiento
    images?: string[];             // URLs de imagenes
    mapImage?: string;             // URL de imagen del mapa con pines
    lotDimensions?: string;        // Medidas del lote
    orientation?: string;          // Orientación
    utilities?: string;            // Servicios
    condition?: string;            // Estado (Excelente, Muy bueno, etc.)
}

export interface TargetProperty extends PropertyCharacteristics {
    address: string;
    coveredSurface: number;
    uncoveredSurface: number;
    surfaceType: SurfaceType;
    homogenizationFactor: number;
}

export interface Comparable extends PropertyCharacteristics {
    id: string;
    address: string;
    price: number;
    coveredSurface: number;
    uncoveredSurface: number;
    surfaceType: SurfaceType;
    homogenizationFactor: number;
    daysOnMarket: number;
    hSurface?: number;
    hPrice?: number;
}

export interface SavedValuation {
    id: string;
    name: string;
    date: number;
    target: TargetProperty;
    comparables: Comparable[];
}
