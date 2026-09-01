# API TESTING GUIDE

## 🌐 API Base URL
```
http://localhost:5000/api
```

## 🔑 Authentication
All endpoints (except login/register) require a JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

---

## 👤 AUTH ENDPOINTS

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "password": "password123",
  "role": "user"
}

Response:
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john",
    "role": "user"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "john",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john",
    "role": "user"
  }
}
```

---

## 🧪 TEST RUN ENDPOINTS

### Get All Test Runs
```
GET /testruns
Authorization: Bearer {token}

Response:
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "testName": "API Test 1",
    "description": "Testing API endpoints",
    "status": "completed",
    "result": "Passed",
    "notes": "All tests passed",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Get Test Run by ID
```
GET /testruns/{id}
Authorization: Bearer {token}

Response single object
```

### Create Test Run
```
POST /testruns
Authorization: Bearer {token}
Content-Type: application/json

{
  "testName": "Performance Test",
  "description": "Testing system performance",
  "status": "pending",
  "result": "",
  "notes": "Initial test"
}

Response: Created test run object
```

### Update Test Run
```
PUT /testruns/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "result": "Passed",
  "notes": "Test completed successfully"
}

Response: Updated test run object
```

### Delete Test Run
```
DELETE /testruns/{id}
Authorization: Bearer {token}

Response:
{
  "message": "Test run deleted"
}
```

### Generate Report (Admin Only)
```
GET /testruns/report/generate
Authorization: Bearer {admin_token}

Response:
{
  "totalCount": 5,
  "byStatus": {
    "pending": 2,
    "completed": 3,
    "failed": 0
  },
  "byUser": {
    "john": [...],
    "jane": [...]
  },
  "data": [...]
}
```

---

## 💧 BOOSTER PUMP ENDPOINTS

### Get All Pumps
```
GET /boosterpumps
Authorization: Bearer {token}

Response:
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "pumpName": "Main Pump",
    "location": "Building A",
    "pressure": 2.5,
    "flow": 150.5,
    "temperature": 45.2,
    "status": "operational",
    "notes": "Running smoothly",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Create Pump Entry
```
POST /boosterpumps
Authorization: Bearer {token}
Content-Type: application/json

{
  "pumpName": "Backup Pump",
  "location": "Building B",
  "pressure": 2.3,
  "flow": 140.0,
  "temperature": 42.5,
  "status": "operational",
  "notes": "Recently serviced"
}

Response: Created pump object
```

### Update Pump Entry
```
PUT /boosterpumps/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "pressure": 2.4,
  "temperature": 43.1,
  "status": "maintenance"
}

Response: Updated pump object
```

### Delete Pump Entry
```
DELETE /boosterpumps/{id}
Authorization: Bearer {token}

Response:
{
  "message": "Booster pump deleted"
}
```

---

## 🔍 DAILY INSPECTION ENDPOINTS

### Get All Inspections
```
GET /dailyinspections
Authorization: Bearer {token}

Response: Array of inspection objects
```

### Get Inspection by ID
```
GET /dailyinspections/{id}
Authorization: Bearer {token}

Response: Single inspection object
```

### Submit Completed Inspection
```
POST /dailyinspections/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "generalItems": {
    "lighting": "good",
    "cleanliness": "fair",
    "safety": "compliant",
    "notes": "Minor issues noted"
  },
  "groundFloor": {
    "condition": "Good condition",
    "issues": "Small paint chip near entrance",
    "notes": "Needs minor maintenance"
  },
  "firstFloor": {
    "condition": "Excellent",
    "issues": "None identified",
    "notes": "Well maintained"
  },
  "secondFloor": {
    "condition": "Good",
    "issues": "Light fixture needs replacement",
    "notes": "Schedule replacement"
  }
}

Response: Created inspection object with status "submitted"
```

### Save Draft Inspection
```
POST /dailyinspections/draft/{id}
Authorization: Bearer {token}
Content-Type: application/json

Send partial data (only filled sections), same structure as submit

Response: Inspection object with status "draft"
```

### Delete Inspection
```
DELETE /dailyinspections/{id}
Authorization: Bearer {token}

Response:
{
  "message": "Daily inspection deleted"
}
```

---

## 🧪 TESTING WITH POSTMAN

### 1. Create Test Collection
- New Collection: "Facility Management API"
- Add all the requests below

### 2. Set Environment Variables
Create an environment with:
- `base_url`: http://localhost:5000/api
- `token`: (will be set after login)

### 3. Pre-request Script for Auto Token
```javascript
// After login request, save token:
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.token);
pm.environment.set("userId", jsonData.user.id);
```

### 4. Test Flow

**Step 1: Register User**
```
POST {{base_url}}/auth/register
{
  "username": "testuser",
  "password": "test123",
  "role": "user"
}
```

**Step 2: Login**
```
POST {{base_url}}/auth/login
{
  "username": "testuser",
  "password": "test123"
}

Copy token to environment variable
```

**Step 3: Create Test Run**
```
POST {{base_url}}/testruns
Header: Authorization: Bearer {{token}}
{
  "testName": "Sample Test",
  "description": "Test description",
  "status": "pending"
}
```

**Step 4: Create Pump Entry**
```
POST {{base_url}}/boosterpumps
Header: Authorization: Bearer {{token}}
{
  "pumpName": "Test Pump",
  "location": "Test Location",
  "pressure": 2.5,
  "flow": 150
}
```

**Step 5: Submit Inspection**
```
POST {{base_url}}/dailyinspections/submit
Header: Authorization: Bearer {{token}}
(Full inspection data)
```

**Step 6: Get Data**
```
GET {{base_url}}/testruns
GET {{base_url}}/boosterpumps
GET {{base_url}}/dailyinspections
```

---

## ✅ CURL COMMAND EXAMPLES

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"password","role":"user"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"password"}'
```

### Create Test Run (set TOKEN variable first)
```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:5000/api/testruns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testName":"Test","status":"pending"}'
```

---

## 🐛 Common Issues

### 401 Unauthorized
- Check token is included in Authorization header
- Verify token is not expired
- Ensure correct format: "Bearer {token}"

### 403 Forbidden
- Admin endpoint accessed with user token
- Check user role in request

### 404 Not Found
- Verify ID exists in database
- Check endpoint path spelling

### 500 Server Error
- Check MongoDB connection
- Verify .env variables are set
- Check backend console for error

---

## 📊 Expected Responses

### Success Response
```json
{
  "statusCode": 200/201,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "statusCode": 400/401/403/500,
  "message": "Error description"
}
```

---

## 🔐 Security Testing

### Test Data Isolation
```
1. Login as user1
2. Get /testruns - should see only user1's data
3. Login as user2
4. Get /testruns - should see only user2's data
5. Try to access user1's data by ID - should get 403
```

### Test Admin Access
```
1. Login as admin
2. Get /testruns - should see all users' data
3. Get /testruns/report/generate - should work
4. Login as user
5. Try /testruns/report/generate - should get 403
```

---

## 📈 Performance Notes

- Response times should be < 500ms
- Queries are optimized with MongoDB indexing on userId
- Pagination ready for implementation if needed

---

## 🔄 Integration Testing Order

1. ✅ Verify MongoDB connection
2. ✅ Test Authentication (register/login)
3. ✅ Test User isolation
4. ✅ Test Admin access
5. ✅ Test CRUD operations on each endpoint
6. ✅ Test data validation
7. ✅ Test error handling
8. ✅ Test authorization middleware

---

Generated: 2024
API Version: 1.0.0
