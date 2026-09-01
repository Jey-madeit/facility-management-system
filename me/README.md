# Facility Management System

A full-stack application for managing facility operations with user and admin roles. This system includes test run management, booster pump monitoring, and daily inspections with multi-section forms.

## Features

### User Features
- **Secure Authentication**: Login with username and password
- **Generate Test Run**: Create and submit test reports (view own data)
- **Booster Pumps**: Enter and monitor pump pressure, flow, and temperature data
- **Daily Inspection**: Multi-section inspection forms with inter-linked sub-sections:
  - General Items
  - Ground Floor
  - First Floor
  - Second Floor

### Admin Features
- **View All Submissions**: Access all user-submitted data
- **Generate Reports**: Create comprehensive reports across all submissions
- **Manage Entries**: Edit and delete submissions
- **User Management**: View all user activities

## Project Structure

```
facility-management/
├── backend/                    # Node.js Express API
│   ├── config/                # Database configuration
│   ├── controllers/            # Business logic
│   ├── middleware/             # Authentication middleware
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API routes
│   ├── server.js              # Main server file
│   ├── package.json           # Dependencies
│   └── .env.example           # Environment template
│
└── frontend/                   # React application
    ├── public/                 # Static files
    ├── src/
    │   ├── components/         # Reusable components
    │   ├── contexts/           # React context (Auth)
    │   ├── pages/              # Page components
    │   ├── services/           # API services
    │   ├── styles/             # CSS files
    │   ├── App.js              # Main app component
    │   └── index.js            # Entry point
    ├── package.json            # Dependencies
    └── .env.example            # Environment template
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud database)

## Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/facility-management
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=development
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the React development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## Demo Credentials

### Regular User
- **Username**: user
- **Password**: password

### Admin User
- **Username**: admin
- **Password**: password

To create these demo users, send POST requests to `/api/auth/register` endpoint after the backend is running.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Test Runs
- `GET /api/testruns` - Get all test runs (users see own, admins see all)
- `GET /api/testruns/:id` - Get test run by ID
- `POST /api/testruns` - Create test run
- `PUT /api/testruns/:id` - Update test run
- `DELETE /api/testruns/:id` - Delete test run
- `GET /api/testruns/report/generate` - Generate report (admin only)

### Booster Pumps
- `GET /api/boosterpumps` - Get all pump entries
- `GET /api/boosterpumps/:id` - Get pump entry by ID
- `POST /api/boosterpumps` - Create pump entry
- `PUT /api/boosterpumps/:id` - Update pump entry
- `DELETE /api/boosterpumps/:id` - Delete pump entry

### Daily Inspections
- `GET /api/dailyinspections` - Get all inspections
- `GET /api/dailyinspections/:id` - Get inspection by ID
- `POST /api/dailyinspections/submit` - Submit completed inspection
- `POST /api/dailyinspections/draft/:id` - Save draft inspection
- `DELETE /api/dailyinspections/:id` - Delete inspection

## Authentication

The application uses JWT (JSON Web Tokens) for authentication. After login:
1. A JWT token is returned and stored in local storage
2. The token is automatically included in all API requests
3. The token is verified on the backend for protected routes
4. Admin-only endpoints check the user's role

## Daily Inspection Workflow

The Daily Inspection form follows a stepped workflow:

1. **Step 1 - General Items**: Evaluate lighting, cleanliness, and safety
   - Next button enables after all fields are filled
2. **Step 2 - Ground Floor**: Document condition, issues, and notes
   - Back button allows returning to previous step
   - Next button enables after all fields are filled
3. **Step 3 - First Floor**: Same as Step 2
4. **Step 4 - Second Floor**: Same as Step 2
   - Submit button sends all collected data to backend
   - After submission, user can view the report

## Database Models

### User
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (enum: 'user', 'admin'),
  email: String,
  timestamps
}
```

### TestRun
```javascript
{
  userId: Reference to User,
  testName: String,
  description: String,
  status: String (enum: 'pending', 'completed', 'failed'),
  result: String,
  notes: String,
  timestamps
}
```

### BoosterPump
```javascript
{
  userId: Reference to User,
  pumpName: String,
  location: String,
  pressure: Number,
  flow: Number,
  temperature: Number,
  status: String (enum: 'operational', 'maintenance', 'offline'),
  notes: String,
  timestamps
}
```

### DailyInspection
```javascript
{
  userId: Reference to User,
  inspectionDate: Date,
  generalItems: { lighting, cleanliness, safety, notes },
  groundFloor: { condition, issues, notes },
  firstFloor: { condition, issues, notes },
  secondFloor: { condition, issues, notes },
  status: String (enum: 'draft', 'submitted', 'reviewed'),
  timestamps
}
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Authorization Checks**: Role-based access control (user vs admin)
- **Data Isolation**: Users can only access their own data (unless admin)
- **Environment Variables**: Sensitive data stored in .env files

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running: `mongod`
- Check backend is running on port 5000
- Verify frontend API URL in .env file

### Authentication Errors
- Check JWT_SECRET is set in backend .env
- Ensure token is being sent in Authorization header
- Clear browser local storage and try logging in again

### CORS Errors
- Verify backend has CORS enabled
- Check frontend API URL matches backend server

## Future Enhancements

- Email notifications for submissions
- Data export to PDF/Excel
- Real-time Dashboard
- Mobile app
- Advanced filtering and search
- Two-factor authentication
- Audit logs

## Support

For issues or questions, please check the code comments or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024
