export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
export interface User {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
}
export interface UserProfile {
    userId: string;
    preferredBudgetMinRub: number | null;
    preferredBudgetMaxRub: number | null;
    preferredBodyTypeId: string | null;
    preferredFuelTypeId: string | null;
    cityId: string | null;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}
export interface AuthResponse {
    user: User;
    token: string;
}
export interface ChatSession {
    id: string;
    userId: string | null;
    title: string;
    contextSummary: any | null;
    status: 'active' | 'completed' | 'archived';
    createdAt: Date;
    finishedAt: Date | null;
}
export interface ChatMessage {
    id: string;
    chatSessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: any | null;
    createdAt: Date;
}
export interface SearchFilters {
    budget_max?: number;
    budget_min?: number;
    body_type?: string;
    fuel_type?: string;
    brand?: string;
    year_min?: number;
    year_max?: number;
}
export interface CarSpecification {
    id: number;
    modelId: number;
    brandId: number;
    name: string;
    externalId: string;
    bodyTypeId: number;
    engineVolume: number;
    horsepower: number;
    fuelTypeId: number;
    transmissionId: number;
    driveTypeId: number | null;
    yearFrom: number;
    yearTo: number;
    priceMin: number;
    priceMax: number;
    fuelConsumption: number;
    acceleration0to100: number;
    maxSpeed: number;
    maintenanceCostPerYear: number;
}
export interface SearchResult {
    specifications: CarSpecification[];
    total: number;
}
//# sourceMappingURL=api.d.ts.map