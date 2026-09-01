# QUICK START GUIDE

## 1️⃣ Backend Setup (Terminal 1)

```bash
cd backend
npm install
copy .env.example .env
# Edit .env file and set these values:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/facility-management
# JWT_SECRET=your_jwt_secret_key_here
# NODE_ENV=development
npm start
```

Expected output: "Server running on port 5000"

## 2️⃣ Start MongoDB

```bash
# Windows users - if MongoDB is installed locally
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env with your connection string
```

## 3️⃣ Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
copy .env.example .env
# .env should contain:
# REACT_APP_API_URL=http://localhost:5000/api
npm start
```

Expected: Browser opens to http://localhost:3000

## 4️⃣ Test the Application

### First Time Setup - Create Demo Users

Send these requests using Postman or curl:

**Register User:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "user",
  "password": "password",
  "role": "user"
}
```

**Register Admin:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "role": "admin"
}
```

### Login and Test

1. Go to http://localhost:3000
2. Login with:
   - Username: `user`
   - Password: `password`
3. Test the three main features:
   - ✅ Generate Test Run
   - ✅ Booster Pumps
   - ✅ Daily Inspection (4 steps)

## Features to Test

### User Testing
- [ ] Login successfully
- [ ] Navigate to Home (3 sections)
- [ ] Create test run entry
- [ ] Add booster pump data
- [ ] Complete daily inspection workflow
- [ ] View submitted data
- [ ] Logout

### Admin Testing
- [ ] Login as admin
- [ ] View all user submissions
- [ ] Generate test run report
- [ ] Access admin features

## Troubleshooting

**Backend won't start?**
- Install Node.js v14+
- Check port 5000 is not in use: `netstat -ano | findstr :5000`

**MongoDB connection error?**
- Ensure MongoDB is running
- Check connection string in .env
- For Atlas: use full connection URI

**Frontend not loading?**
- Clear browser cache: Ctrl+Shift+Delete
- Check frontend .env has correct API_URL
- Check backend is running

## Project Files Created

### Backend
- ✅ Server setup with Express
- ✅ Database connection (Mongoose)
- ✅ User authentication with JWT
- ✅ 3 data models (TestRun, BoosterPump, DailyInspection)
- ✅ Role-based API routes
- ✅ Password encryption (bcryptjs)

### Frontend
- ✅ React app with routing
- ✅ Authentication context
- ✅ 4 pages (Login, Home, 3 sections)
- ✅ Responsive forms
- ✅ API service layer
- ✅ Protected routes
- ✅ Professional styling

## Stopping the Application

- Press `Ctrl+C` in both terminal windows
- MongoDB: Press `Ctrl+C` (if running locally)

## Next Steps

1. Customize branding/colors in CSS files
2. Add more validation as needed
3. Set up MongoDB backup strategy
4. Deploy to cloud (Heroku, AWS, etc.)
5. Configure CORS for production domains

---

**Need Help?** Check the main README.md in the project root.
