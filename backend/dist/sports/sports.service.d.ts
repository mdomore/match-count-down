export interface Sport {
    id: string;
    name: string;
    defaultDuration: number;
    periods: number;
    description: string;
}
export declare class SportsService {
    private readonly sports;
    getAllSports(): Sport[];
    getSportById(id: string): Sport | undefined;
}
