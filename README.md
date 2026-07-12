# 🚛 TransitOps – Smart Transport Operations Platform

## Overview

TransitOps is a centralized Fleet & Transport Management System developed for the Odoo Hackathon 2026. It enables organizations to efficiently manage vehicles, drivers, trips, maintenance, fuel consumption, operational expenses, and analytics through a single platform.

The system digitizes the complete transport lifecycle while enforcing business rules and providing real-time operational insights. 0

---

## Features

- 🔐 Secure Authentication & Role-Based Access Control (RBAC)
- 🚚 Vehicle Management
- 👨‍✈️ Driver Management
- 🛣️ Trip Management
- 🔧 Vehicle Maintenance
- ⛽ Fuel & Expense Management
- 📊 Dashboard with KPIs
- 📈 Reports & Analytics
- ✅ Business Rule Validation

---

## 💻 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios
- React Router DOM

### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication

### Database
- MySQL

### Build Tool
- Maven

### Version Control
- Git & GitHub

---

## 📂 Project Structure

```
TransitOps
│
├── frontend
├── backend
└── README.md
```

---

## 📋 Modules

- Authentication
- Dashboard
- Vehicle Registry
- Driver Management
- Trip Management
- Maintenance Management
- Fuel & Expense Management
- Reports & Analytics

These modules are based on the hackathon requirements for secure authentication, vehicle/driver management, trip lifecycle, maintenance, fuel & expense tracking, and operational reporting. 1

---

## 📜 Business Rules

- Vehicle registration number must be unique.
- Retired or In-Shop vehicles cannot be dispatched.
- Drivers with expired licenses cannot be assigned to trips.
- Cargo weight cannot exceed vehicle capacity.
- Vehicle and Driver status automatically change during dispatch and trip completion.
- Maintenance automatically marks vehicles as In-Shop.

These validations are core requirements of the problem statement. 2

---

## ⚙️ Installation

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Objective

Build an end-to-end smart transport operations platform that improves fleet efficiency, reduces manual work, and provides real-time operational insights for logistics organizations. 3

---

## 🌟 Future Enhancements

- AI Route Optimization
- Predictive Maintenance
- Return Load Recommendation
- Email Notifications
- PDF & CSV Export
- Live Vehicle Tracking

---

## 👥 Team

**Team Name:** TransitOps

- Anushka Chourasia (Team Lead)
- Chirag Nikwad
- Aditi Nandkumar Gaikwad
- Manvitha Reddy Indukuri
