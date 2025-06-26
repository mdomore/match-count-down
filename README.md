# Match Count Down ⏱️

A modern web application for displaying match timers and scoreboards for various sports.

## Overview

Match Count Down is a responsive web application that allows users to:
- Display real-time match timers for different sports
- Show live scoreboards with customizable layouts
- Choose from various sports with pre-configured timer settings
- Manage multiple matches simultaneously

## Features

- **Multi-Sport Support**: Configure timers for different sports (football, basketball, tennis, volleyball, horseball, etc.)
- **Real-Time Timer**: Countdown and count-up timer modes
- **Scoreboard Display**: Live score tracking with customizable layouts
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Sport-Specific Settings**: Automatic timer configurations based on selected sport

## Commercial Potential

### Target Markets
- Sports clubs and facilities
- Event organizers
- Schools and universities
- Corporate events
- Tournament organizers
- Sports bars and venues

### Business Model

#### SaaS Model (Recommended)
- **Freemium**: Basic timer for free, premium features paid
- **Tiered Pricing**: 
  - Basic: $9/month (single venue)
  - Pro: $29/month (multiple venues)
  - Enterprise: $99/month (unlimited venues + API)

#### White-label Solutions
- Custom branding for sports clubs
- API access for integration
- Custom themes and colors

#### Event-specific Packages
- Tournament packages
- Season passes for clubs
- One-time event licenses

### Revenue Streams
```
├── SaaS Subscriptions: $9-99/month
├── White-label Licenses: $500-2000/year
├── Custom Development: $50-100/hour
└── API Usage: $0.01-0.10 per API call
```

## Development Roadmap

### Phase 1: MVP Enhancement (2-3 weeks)
- User registration/login
- Custom branding
- Multiple timer support
- Basic analytics

### Phase 2: Commercial Features (4-6 weeks)
- Payment integration (Stripe)
- Subscription management
- Advanced customization
- Export/sharing features

### Phase 3: Advanced Features (6-8 weeks)
- API development
- White-label solutions
- Advanced analytics
- Mobile app

## Planned Features

### Core Features to Add
1. **User Authentication & Multi-tenancy**
2. **Custom Branding** (logos, colors, themes)
3. **Multiple Timer Support** (concurrent matches)
4. **Scoreboard Templates** (different sports)
5. **Export/Sharing** (QR codes, live URLs)
6. **Analytics Dashboard** (usage stats)
7. **Mobile Responsive** (already implemented!)
8. **Offline Support** (PWA)

### Advanced Features
1. **Live Streaming Integration**
2. **Social Media Integration**
3. **Custom Sound Effects**
4. **Video Replay Integration**
5. **Statistics Tracking**
6. **Team Management**
7. **Tournament Brackets**

## Tech Stack

### Frontend
- **Next.js** - React framework for production
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library

### Backend
- **NestJS** - Progressive Node.js framework

### Planned Additions
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js or Auth0
- **Payments**: Stripe
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **Monitoring**: Sentry + Analytics

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd match-count-down
```

2. Install all dependencies
```bash
npm run install:all
```

3. Start the development servers
```bash
npm run dev
```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:3001) servers.

### Manual Setup

If you prefer to set up each part separately:

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Backend Setup
```bash
cd backend
npm install
npm run dev
```

## Usage

1. Open http://localhost:3000 in your browser
2. Select a sport from the dropdown menu
3. Configure match settings (duration, periods, etc.)
4. Start the timer
5. Update scores as the match progresses
6. View real-time updates on the scoreboard

## Supported Sports

- **Football**: 2 periods of 45 minutes each
- **Basketball**: 4 quarters of 12 minutes each
- **Tennis**: 3 sets of 30 minutes each
- **Volleyball**: 5 sets of 30 minutes each
- **Horseball**: 2 periods of 10 minutes each
- **Custom**: Configurable duration and periods

## Project Structure

```
match-count-down/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utility functions
│   └── package.json
├── backend/                 # NestJS API
│   ├── src/                # Source code
│   │   ├── sports/         # Sports module
│   │   └── main.ts         # Application entry point
│   └── package.json
├── package.json            # Root package.json (monorepo)
└── README.md
```

## API Endpoints

### Backend (http://localhost:3001)

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /sports` - Get all available sports

## Next Steps for Commercial Launch

1. **Validate Market**: Talk to potential customers
2. **Enhance MVP**: Add user accounts and branding
3. **Launch Beta**: Get early adopters
4. **Iterate**: Based on user feedback
5. **Scale**: Marketing and sales

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.