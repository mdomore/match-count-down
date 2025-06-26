import { SportsService } from './sports.service';
export declare class SportsController {
    private readonly sportsService;
    constructor(sportsService: SportsService);
    getAllSports(): import("./sports.service").Sport[];
}
