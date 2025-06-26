import { Injectable } from '@nestjs/common';

export interface Sport {
  id: string;
  name: string;
  defaultDuration: number;
  periods: number;
  description: string;
}

@Injectable()
export class SportsService {
  private readonly sports: Sport[] = [
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

  getAllSports(): Sport[] {
    return this.sports;
  }

  getSportById(id: string): Sport | undefined {
    return this.sports.find(sport => sport.id === id);
  }
} 