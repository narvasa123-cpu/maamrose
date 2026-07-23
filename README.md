# Check Printing and Voucher Record Management System

Enterprise web application built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Firebase** (Authentication, Cloud Firestore, Firebase Storage) for managing official voucher payment records and precision pre-printed check printing.

---

## 🌟 Key Features

1. **Voucher Record Management (CRUD)**
   - Create, edit, search, filter, paginate, and archive payment voucher records.
   - Real-time automatic currency conversion to written words (e.g. `₱142,300.50` -> `ONE HUNDRED FORTY-TWO THOUSAND THREE HUNDRED PESOS & 50/100 ONLY`).
   - Voucher status workflow: `Draft` -> `Pending` -> `Approved` -> `Archived`.

2. **Pre-Printed Check Printing Studio**
   - Office check paper alignment studio with millimeter offset coordinates ($X / Y$) for Payee, Date, Amount (Num & Words), and Memo.
   - Interactive grid/ruler alignment lines toggle.
   - CSS `@media print` engine that strips backgrounds when printing onto physical pre-printed check paper stock.
   - Automatic record logging into Firestore `checks` collection.

3. **Supporting Document Uploads (Firebase Storage)**
   - Drag-and-drop document uploader with file size validation (< 10MB) for PDF, JPG, PNG, and JPEG formats.
   - In-app preview modal with zoom/view, download, and delete options.
   - Linked directly to specific voucher records.

4. **Financial & Disbursal Reports**
   - Daily, Monthly, Yearly, and Custom Date Range disbursal reports.
   - Interactive Recharts visualizations (Disbursements by Department, Monthly Disbursal Trends).
   - Export to **PDF** (via `jsPDF`) and **Excel** (via `SheetJS / xlsx`).

5. **Role-Based Access Control (RBAC) & Security Audit Logs**
   - **Admin Role**: Full access to User Management, RBAC role assignment, check alignment settings, and audit logs.
   - **Staff Role**: Access to Voucher creation, document uploads, and check printing.
   - **Activity Logs**: Immutable audit log of logins, voucher changes, document attachments, check printings, and user provisioning.

---

## 🚀 Quick Start / Installation Guide

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation Steps
```bash
# 1. Clone repository or extract codebase
# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
The application will boot at `http://localhost:3000`.

---

## 🔑 Demo Quick Login Credentials

- **Administrator**: `admin@checksystem.com` / `admin123` (Full system access)
- **Staff User**: `staff@checksystem.com` / `staff123` (Disbursement & Printing access)

---

## 🔥 Firebase Setup Guide

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Firebase Authentication** (Email/Password & Google Sign-In).
3. Enable **Cloud Firestore** and deploy the `firestore.rules` security file included in root.
4. Enable **Firebase Storage** for document uploads.
5. Create `.env` from `.env.example` and set your configuration variables:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

---

## 🌐 Deployment Guide

### Building for Production
```bash
npm run build
```
This compiles optimized static bundles into `dist/`.

### Hosting Options
- **Firebase Hosting**: Run `firebase deploy`
- **Cloud Run / Vercel / Netlify**: Deploy `dist/` directory as a Single Page Application (SPA).

---

## 🧪 Testing Checklist

- [x] **Authentication**: Login as Admin and Staff, test persistent session and logout.
- [x] **Vouchers**: Create voucher, verify real-time amount-to-words conversion, search, filter, edit, and archive.
- [x] **Document Attachments**: Drag and drop PDF/image, preview modal, and delete attachment.
- [x] **Check Printing**: Select approved voucher, adjust millimeter offset sliders, toggle gridlines, and print.
- [x] **Reports**: Filter by month/year, verify Recharts, export PDF, export Excel.
- [x] **User Management & Audit Logs**: Provision new staff account, toggle status, and inspect activity logs.
