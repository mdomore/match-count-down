"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsService = void 0;
const common_1 = require("@nestjs/common");
let SportsService = class SportsService {
    constructor() {
        this.sports = [
            {
                id: 'football',
                name: 'Football',
                defaultDuration: 2700,
                periods: 2,
                description: 'Association football with two 45-minute periods'
            },
            {
                id: 'basketball',
                name: 'Basketball',
                defaultDuration: 1200,
                periods: 4,
                description: 'Basketball with four 12-minute quarters'
            },
            {
                id: 'tennis',
                name: 'Tennis',
                defaultDuration: 1800,
                periods: 3,
                description: 'Tennis with three 30-minute sets'
            },
            {
                id: 'volleyball',
                name: 'Volleyball',
                defaultDuration: 1800,
                periods: 5,
                description: 'Volleyball with five 30-minute sets'
            },
            {
                id: 'horseball',
                name: 'Horseball',
                defaultDuration: 600,
                periods: 2,
                description: 'Horseball with two 10-minute periods'
            },
            {
                id: 'custom',
                name: 'Custom',
                defaultDuration: 1800,
                periods: 1,
                description: 'Custom timer with configurable duration'
            }
        ];
    }
    getAllSports() {
        return this.sports;
    }
    getSportById(id) {
        return this.sports.find(sport => sport.id === id);
    }
};
exports.SportsService = SportsService;
exports.SportsService = SportsService = __decorate([
    (0, common_1.Injectable)()
], SportsService);
//# sourceMappingURL=sports.service.js.map