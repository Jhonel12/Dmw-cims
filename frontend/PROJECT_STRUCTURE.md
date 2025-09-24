# OFW Tracking System - Frontend Structure

## Project Overview
This is a TypeScript React application for tracking Overseas Filipino Workers (OFW) for DMW Region 10. The system provides administrative functionality for manual data entry and management of OFW records.

## Folder Structure

```
frontend/src/
├── components/           # Reusable UI components
│   ├── layout/          # Layout components (Header, Sidebar, Layout)
│   ├── forms/           # Form components (OFWForm)
│   ├── tables/          # Table components (OFWTable)
│   └── filters/         # Filter components (SearchFilters)
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard page
│   ├── OFWList.tsx     # OFW records listing page
│   └── AddOFW.tsx      # Add new OFW page
├── types/               # TypeScript type definitions
│   ├── ofw.ts          # OFW-related types
│   └── common.ts       # Common types
├── constants/           # Application constants
│   ├── countries.ts    # Country options
│   └── positions.ts    # Position/profession options
├── utils/               # Utility functions
│   ├── dateUtils.ts    # Date formatting utilities
│   └── validation.ts   # Form validation utilities
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with government theme
```

## Key Features

### 1. OFW Data Management
- **TH Name**: Worker's name
- **Sex**: Male/Female
- **Position**: Job position/profession
- **Address**: Complete address
- **Employer**: Employer name
- **Country Destination**: Destination country
- **E-Receipt Number**: Electronic receipt number
- **OEC Number**: Overseas Employment Certificate number
- **Departure Date**: Date of departure

### 2. Government-Style Interface
- DMW Region 10 branding
- Professional blue color scheme
- Clean, formal layout
- Responsive design for various screen sizes

### 3. Data Entry Forms
- Comprehensive form validation
- Dropdown selections for countries and positions
- Date picker for departure dates
- Real-time validation feedback

### 4. Data Display
- Sortable data table
- Search and filter functionality
- Pagination support
- Edit/Delete actions

### 5. Dashboard
- Statistics overview
- Recent departures
- Quick action buttons

## Technology Stack
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Vite** for build tooling

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Component Architecture

### Layout Components
- `Header`: Top navigation with DMW branding
- `Sidebar`: Navigation menu with government styling
- `Layout`: Main layout wrapper

### Form Components
- `OFWForm`: Comprehensive form for OFW data entry with validation

### Table Components
- `OFWTable`: Data table with sorting, filtering, and actions

### Filter Components
- `SearchFilters`: Advanced search and filter interface

## Styling
The application uses a custom government theme with:
- Professional blue color palette
- Clean typography
- Consistent spacing and shadows
- Responsive grid layouts
- Government-appropriate styling classes

## Future Enhancements
- User authentication
- Role-based access control
- Data export functionality
- Advanced reporting
- API integration
- Data persistence
