# Quill Your Dream - Paper Quilling Art Portfolio

## Overview

Quill Your Dream is a portfolio and e-commerce platform showcasing the paper quilling artworks of Los Angeles-based artist Shushan Aleksanyan. The application enables visitors to browse artwork collections, learn about the artist, and submit commission inquiries. An administrative interface allows the artist to manage artworks, artist information, FAQs, and site settings.

The platform features optimized image delivery, SEO enhancements with structured data markup, and a modern, responsive design built with React and shadcn/ui components.

**Production Server**: 165.232.58.95 (DigitalOcean)  
**Domain**: quillyourdream.com  
**Automated Deployment**: GitHub Actions CI/CD pipeline on `main` branch push

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture Pattern

The application follows a monorepo full-stack architecture with clear separation between client and server code:

- **Frontend**: React SPA using Vite for development and production builds
- **Backend**: Express.js REST API with session-based authentication
- **Build Process**: Single deployment artifact combining frontend static assets and backend server

**Rationale**: This architecture enables rapid development with hot module replacement while producing an optimized production bundle. The monorepo structure simplifies dependency management and allows code sharing through the `shared` directory.

### Database Strategy: Dual Database Services (NeDB & MongoDB)

The application supports two database services with **NeDB as the default** for simpler deployment:

**Available Database Services**:
1. **NeDB** (default) - File-based database (`server/nedb.ts`)
2. **MongoDB** (optional) - External database via Mongoose (`server/db.ts`)

**Key Architectural Decision**: NeDB is the default choice because:
- Zero external dependencies - works out of the box
- File-based persistence in `data/nedb/` folder
- Perfect for small to medium portfolios
- Simpler deployment and maintenance
- MongoDB remains available for high-traffic scenarios

**Implementation Details**:
- Default: NeDB database service (`server/nedb.ts`)
- Optional: MongoDB database service via Mongoose (`server/db.ts`)
- Set `USE_NEDB=false` to switch to MongoDB
- Proxy-based model system returns appropriate database adapter
- Automatic sample data population on first run

**NeDB Database Service Features**:
- ✅ **Persistent file storage** in `data/nedb/` folder (data survives restarts)
- ✅ Auto-populates 8 artworks from `server/data/artworks.json` on first run
- ✅ Loads artist info from `server/data/artist.json`
- ✅ Loads 10 FAQs from `server/data/faqs.json`
- ✅ Creates default admin user (email: admin@quillyourdream.com, password: admin123)
- ✅ Creates default site settings
- ✅ Full Mongoose-compatible query API with chaining (`.find().sort().limit()`)
- ✅ **Production-ready** - Default choice for deployment

**Database Selection**:
- Default: NeDB database service (no configuration needed)
- Set `USE_NEDB=false` to use MongoDB database service instead
- NeDB recommended for most use cases (simpler, no external dependencies)
- MongoDB available for high-traffic or multi-instance deployments

**Default Admin Credentials**:
- **NeDB**: email: `admin@quillyourdream.com`, password: `admin123`
- **MongoDB**: email: `admin@quillyourdream.com`, password: `BlueGrass20!`
- Different passwords for security based on deployment context

**Production Deployment Options**:
1. **Recommended**: Use NeDB (default) - simple deployment, no external database needed
2. **Advanced**: Set `USE_NEDB=false` and use MongoDB for high-traffic scenarios

**ID Handling Strategy** (October 2025 Update):
- **Hash Function**: Uses DJB2 hash algorithm (`hashStringToNumber()`) to convert any string ID to stable positive 32-bit integer
- **Schema**: All models use numeric `id: number` type for TypeScript consistency
- **NeDB**: Alphanumeric `_id` field hashed to create numeric `id` for frontend
- **MongoDB**: ObjectId `_id` field hashed to create numeric `id` for frontend
- **Frontend**: Always works with numeric IDs (simple, consistent API)
- **Backend**: Routes use `hashStringToNumber()` consistently across all collections:
  - User lookups: Hash-based search by email or hashed _id
  - Artwork/FAQ updates: Hash-based document lookup
  - All deletes: Hash-based document lookup
- **Update Operations**: NeDB updates MUST use `$set` operator (e.g., `{ $set: { field: value } }`)
- **Numeric Fields**: All dimensions use proper types (depth/price use `parseFloat()`)
- **HTTP Methods**: All update routes use PATCH (not PUT) to match frontend
- **Compatibility**: NeDB returns plain objects (no `.toObject()`), MongoDB uses Mongoose documents
- **Admin User**: Ensured to exist on every startup (created if missing)

### Authentication & Authorization

**Strategy**: Session-based authentication using Passport.js with local strategy

**Implementation**:
- Sessions stored in file-based store (NeDB mode) or MongoDB (`connect-mongo`)
- Password hashing with bcrypt (10 salt rounds)
- Role-based access control (RBAC) with "admin" and "user" roles
- Protected admin routes require authentication + admin role
- Cookie-based sessions with HTTP-only flag
- Admin user automatically created on first run

**User Management Features**:
- Create new users with email, password, and role assignment
- Delete users (with self-deletion prevention)
- Change password with current password verification
- User list view in admin panel

**API Endpoints**:
- `POST /api/login` - Authenticate user
- `POST /api/logout` - End session
- `POST /api/admin/users` - Create new user (admin only)
- `GET /api/admin/users` - List all users (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only, prevents self-deletion)
- `PATCH /api/auth/password` - Change current user password (authenticated)

**Rationale**: Session-based auth was chosen over JWT to simplify the architecture for a content management scenario, with session persistence matching the database strategy.

### Image Processing & Optimization

**Multi-Variant Image Pipeline**: Images are processed into four sizes (thumbnail, grid, feature, full) in both WebP and JPEG formats.

**Architecture**:
- Sharp library for server-side image processing (`scripts/process-images.ts`)
- Metadata JSON files store variant URLs, dimensions, dominant colors, and blur placeholders
- React component (`OptimizedImage.tsx`) selects appropriate variant based on display context
- Caching layer prevents redundant metadata fetches

**Benefits**:
- Responsive images reduce bandwidth for mobile users
- WebP provides 25-30% better compression than JPEG
- Blur placeholders improve perceived loading performance
- Dominant color extraction enables skeleton loading states

### Frontend Architecture

**Technology Stack**:
- **React 18** with TypeScript for type safety
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management and caching
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with CSS variables for theming

**State Management Strategy**:
- Server state: TanStack Query with aggressive caching
- UI state: React hooks and context (theme, mobile menu)
- Form state: React Hook Form with Zod validation
- No global state management library needed

**Design Patterns**:
- Component composition over inheritance
- Custom hooks for reusable logic (useAuth, useAccentColor, useTheme)
- Protected routes with authentication HOC
- Optimistic UI updates for admin operations

### Theming System

**Dual-Layer Theme Architecture**:

1. **Light/Dark Mode**: Toggle between light and dark color schemes
2. **Dynamic Accent Colors**: Admin-configurable HSL values for brand colors

**Implementation**:
- CSS custom properties store theme values
- `useTheme` hook manages light/dark preference with localStorage persistence
- `useAccentColor` hook fetches admin settings and applies HSL values to multiple CSS variables
- Real-time preview in admin settings panel

**Technical Approach**: HSL (Hue, Saturation, Lightness) enables algorithmic color variations for hover states and borders without storing multiple color values.

### SEO & Structured Data

**Multi-Layer SEO Strategy**:

1. **Dynamic Meta Tags**: Component-based SEO with page-specific titles and descriptions
2. **JSON-LD Structured Data**: Schema.org markup for rich search results
3. **Semantic HTML**: Proper heading hierarchy and ARIA labels

**Structured Data Types**:
- Person schema for artist profile
- VisualArtwork schema for individual pieces
- FAQPage schema with question-answer pairs
- Breadcrumb navigation schema
- CollectionPage schema for portfolio

**Rationale**: Search engines prioritize structured data for rich snippets, increasing click-through rates for artist portfolios and artwork listings.

### API Design

**RESTful Endpoints with Conventional Patterns**:

- `GET /api/artworks` - List all artworks
- `GET /api/artworks/featured` - Featured artworks only
- `GET /api/artworks/:slug` - Single artwork by slug
- `GET /api/artworks/related/:slug` - Related artworks
- `POST /api/admin/artworks` - Create artwork (authenticated)
- `PUT /api/admin/artworks/:id` - Update artwork (authenticated)
- `DELETE /api/admin/artworks/:id` - Delete artwork (authenticated)

**Authentication Endpoints**:
- `POST /api/login` - Create session
- `POST /api/logout` - Destroy session
- `GET /api/auth/user` - Current user info

**Design Decisions**:
- Public routes return filtered data (e.g., only available artworks)
- Admin routes prefixed with `/admin/` for clear access control
- Consistent error responses with status codes and messages
- Credentials included for cookie-based sessions

## External Dependencies

### Third-Party Services

**Image Storage**: Static file serving from `attached_assets` directory
- No CDN or cloud storage integration currently
- Future enhancement: Cloudinary or S3 integration for scalability

**Email Service**: Not implemented
- Contact form submissions logged server-side
- Future enhancement: SendGrid or Nodemailer integration

### Database Connection

**MongoDB**: 
- Connection string via `MONGODB_URI` environment variable
- Fallback to `mongodb://localhost:27017/quillyourdream` for development
- Mongoose driver version 5.x

### UI Component Libraries

**shadcn/ui**: Unstyled, accessible components built on:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Class Variance Authority for variant management

**Key Components**:
- Form components with React Hook Form integration
- Dialog/modal system
- Toast notifications
- Sidebar navigation
- Card layouts

### Build & Development Tools

**Vite**: Frontend build tool
- Development server with HMR
- Production bundling with Rollup
- Path aliases for clean imports

**esbuild**: Backend bundling
- Fast TypeScript compilation
- ES modules output
- External package references (not bundled)

**TypeScript**: Static typing across client, server, and shared code
- Strict mode enabled
- Path aliases configured in tsconfig.json

### Deployment Strategy

**Development Environment (Replit)**:
- Cartographer plugin for development environment
- Runtime error modal overlay
- Dev banner for Replit deployments
- Conditional plugin loading based on `NODE_ENV` and `REPL_ID`

**Production Deployment (Automated CI/CD)**:
- **CI/CD**: GitHub Actions workflow (`.github/workflows/production-deploy.yml`)
- **Trigger**: Automatic deployment on push to `main` branch
- **Container Orchestration**: Docker Compose
- **Database**: NeDB (default) - file-based, no external database needed
- **Authentication**: SSH with password
- **Build Output**: 
  - Frontend: Compiled to `dist/public`
  - Backend: Bundled to `dist/index.js`
  - Docker image with Node.js 20 Alpine
  - Static asset serving from Express

**Deployment Method**:
- **Docker Compose** with NeDB (default):
  - Automatic deployment on every `main` branch push via SSH
  - Containerized application (`quillyourdream-app`)
  - File-based database persists in `./data/nedb/` volume
  - Zero downtime deployments with container orchestration
  - Optional MongoDB via `--profile mongodb` flag
  - Optional Nginx reverse proxy via `--profile production` flag

**Database Configuration**:
- Default: `USE_NEDB=true` (no configuration needed)
- Optional: `USE_NEDB=false` + `--profile mongodb` for MongoDB database service

**Required GitHub Secrets**:
- `SERVER_HOST`: Your production server IP address
- `SERVER_USERNAME`: SSH username
- `SERVER_PASSWORD`: SSH password

See `DEPLOYMENT.md` for detailed deployment instructions and troubleshooting.