🔐 1. Authentication & User Roles
Patients and Doctors register and log in via separate endpoints.
JWT-based auth with role middleware.
POST /api/auth/patient/register // Register patient
POST /api/auth/doctor/register // Register doctor
POST /api/auth/login // Login (shared)
POST /api/auth/logout // Logout (optional)
GET /api/profile // Get own profile (protected)
👩‍⚕️ 2. Doctor Management
Doctors manage public-facing profile and specialization.
GET /api/doctors // List all doctors
GET /api/doctors/:id // View doctor profile
PATCH /api/doctors/:id // Update profile (auth: doctor)
👨‍💻 3. Patient Management
Patients can view and edit their medical info.
GET /api/patients/:id // View patient profile
PATCH /api/patients/:id // Update profile (auth: patient)
🗓️ 4. Availability Management (Doctors)
Supports both stream (1 patient) and wave (multiple).
GET /api/doctors/:id/slots // Get all available slots
POST /api/doctors/:id/slots // Add slot (auth: doctor) // Body:{
date: "2025-07-18",
startTime: "10:00",
endTime: "10:30",
mode: "wave", // "stream" or "wave"maxBookings: 3 // required for "wave"}
DELETE /api/doctors/:id/slots/:slotId // Delete a slot
📅 5. Appointment Booking
Handles both scheduling modes:
POST /api/appointments/
Body: { doctorId, slotId, reason }
→ "stream": if already booked → 409 Conflict  
→ "wave": check current count < maxBookings
PATCH /api/appointments/:id/reschedule // Change appointment slot
DELETE /api/appointments/:id // Cancel appointment
🧾 6. View Appointments
Role-specific appointment views:
GET /api/appointments/patient/:id // Patient's appointments
GET /api/appointments/doctor/:id // Doctor's appointments

Here are the testing endpoints for **Doctor Management** (Step 2), including the HTTP method, URL, required headers, and JSON data (if applicable):

---

### ✅ 1. **Get all doctors**

**Method:** `GET`
**URL:** `/api/doctors`
**Auth Required:** ❌ No
**Test:** Use Postman or curl

```bash
GET http://localhost:3000/api/doctors
```

---

### ✅ 2. **Get doctor by ID**

**Method:** `GET`
**URL:** `/api/doctors/:id`
**Auth Required:** ❌ No
**Example:**

```bash
GET http://localhost:3000/api/doctors/3
```

---

### ✅ 3. **Update doctor profile**

**Method:** `PATCH`
**URL:** `/api/doctors/:id`
**Auth Required:** ✅ Yes (JWT token in header, must be the logged-in doctor)

#### 🔐 Headers:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### 📨 Sample JSON Body:

```json
{
  "name": "Dr. Swamy",
  "specialization": "Cardiologist",
  "experience": 5,
  "qualification": "MBBS, MD",
  "bio": "Experienced cardiologist with 5 years in private practice"
}
```

#### 📌 Example:

```bash
PATCH http://localhost:3000/api/doctors/3
```

---
