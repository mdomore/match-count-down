import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SportsController } from './sports/sports.controller';
import { SportsService } from './sports/sports.service';

@Module({
  imports: [],
  controllers: [AppController, SportsController],
  providers: [AppService, SportsService],
})
export class AppModule {} 