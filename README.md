# SkinZone Digital Loyalty Platform

## Project Overview

SkinZone is a **digital loyalty management system** designed for a dedicated skin treatment agency. The platform replaces outdated physical punch card loyalty systems with a secure, scalable, and user-friendly mobile application. This solution centralizes customer data, ensures accurate visit tracking, prevents fraudulent behavior, and provides a seamless experience for both customers and service providers.

## Problem Statement

Traditional loyalty systems at SkinZone rely on **physical punch cards**, which present significant operational and security challenges:

- **Card Loss & Damage**: Customers frequently lose or damage cards, resulting in lost loyalty data.
- **Inaccurate Tracking**: Manual punch systems are error-prone and difficult to audit.
- **Forgotten Cards**: Customers often forget cards at home, creating poor user experience and reducing system effectiveness.
- **Fraud Risk**: Physical cards are vulnerable to duplication, forgery, and unauthorized transfers.
- **Poor Data Insights**: Manual systems provide no analytics or customer behavior insights.
- **Scalability Issues**: Difficult to manage as the customer base grows.

## Solution

SkinZone Digital Loyalty Platform addresses these challenges through:

### Core Features

- **Secure Authentication**: User registration and login with email verification via Supabase Auth
- **Digital Loyalty Tracking**: Replace physical punch cards with digital visit records
- **Points System**: Earn points for treatments and redeem for free services (500+ points)
- **Free Visit Claims**: Customers can claim free treatments when points threshold is reached
- **User Profiles**: Centralized customer data with editable fields (name, surname, email, phone, date of birth)
- **Profile Pictures**: Upload and manage profile pictures with Supabase Storage
- **Profile Management**: Full CRUD operations on user data with validation
- **Password Management**: Secure password change and reset functionality
- **Home Dashboard**: Personalized welcome screen showing user name, points balance, and recent visits
- **History Tracking**: View past visitations with service details and points earned
- **Real-Time Notifications**: In-app notifications for visit confirmations and updates
- **Staff Dashboard**: Admin interface to add customer visits and manage treatments/products
- **Treatment & Product Management**: Track both services and product sales with mutual exclusivity
- **Session Persistence**: Automatic login state management across app restarts
- **Input Validation**: Real-time validation for email addresses, phone numbers, and passwords
- **Caching System**: Optimized data fetching with intelligent cache invalidation
- **Fraud Prevention**: Secure, account-based verification prevents unauthorized loyalty claims

### Technical Architecture

- **Frontend**: React Native with Expo for iOS/Android/Web
- **Backend**: Supabase (PostgreSQL + Auth + Real-time capabilities)
- **Security**: End-to-end encrypted authentication, secure password handling, session persistence
- **Scalability**: Designed to support growth from hundreds to thousands of customers

## Project Vision

### Phase 1 (Current) ✅

- ✅ Authentication (Login, Sign Up, Password Reset)
- ✅ User profile management with edit capabilities
- ✅ Password change functionality
- ✅ Profile image upload with Supabase Storage
- ✅ Customer Profile screen with editable fields
- ✅ Home screen with welcome dashboard
- ✅ Points accumulation and tracking system
- ✅ Points balance display with real-time updates
- ✅ Free visit claiming (500+ points threshold)
- ✅ History/Visitations tracking with detailed records
- ✅ Real-time notifications system
- ✅ Bottom tab navigation
- ✅ Input validation (email, phone, password)
- ✅ Supabase database integration
- ✅ Session management
- ✅ Data caching with automatic invalidation

### Phase 2 (In Progress)

- ✅ Staff dashboard with customer management
- ✅ Add visit/treatment workflow for staff
- ✅ Product sales tracking alongside treatments
- ✅ Treatment and product mutual exclusivity
- ⏳ Appointment booking system
- ⏳ Visit verification workflow
- ⏳ Advanced analytics & reporting

### Phase 3 (Planned)

- Marketing automation
- SMS notifications
- Customer insights & behavior analytics
- Payment gateway integration
- Multi-branch support

## Technology Stack

- **Frontend Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend & Auth**: Supabase (PostgreSQL + Authentication + Storage)
- **Navigation**: Expo Router with bottom tabs
- **State Management**: React Hooks + Async Storage
- **UI Components**: Custom reusable component library
- **Icons**: Lucide React Native
- **Image Handling**: Expo Image Picker with blob upload
- **Storage**: Supabase Storage for profile pictures
- **Notifications**: Expo Notifications
- **Security**: Supabase Auth with email verification & RLS policies
- **Form Validation**: Custom validation for email, phone, and password fields
- **Date Handling**: React Native DateTimePicker
- **Caching**: Custom cache manager with pattern-based invalidation

## Key Features Explained

### Points & Loyalty System

- **Points Accumulation**: Customers earn points for each treatment/service received
- **Points Balance**: Calculated as: Total Points Earned - Points Used
- **Free Visit Threshold**: 500 points required to claim a free treatment
- **Redemption**: Customers can select any available treatment when claiming
- **Automatic Deduction**: Points are automatically deducted after successful claim
- **Real-time Updates**: Points balance refreshes immediately after visits or claims

### Treatment vs Products

- **Treatments**: Services provided (facials, massages, etc.) - earn loyalty points
- **Products**: Retail items sold (skincare products, etc.) - no points earned
- **Mutual Exclusivity**: Staff can add either a treatment OR a product per visit, not both
- **Unified Storage**: Both use the Services table with category field differentiation

### Profile Picture Management

- **Upload Options**: Take photo with camera or choose from library
- **iOS Compliance**: Proper permission handling per Apple guidelines
- **Storage**: Securely stored in Supabase Storage bucket
- **Optimization**: Images compressed to 70% quality, 1:1 aspect ratio
- **Fallback**: User icon displayed when no profile picture exists

### Staff Dashboard Features

- **Customer Search**: Quick search by name, surname, or phone
- **Visit Management**: Add new visits for treatments or products
- **Service Selection**: Dropdown menus for treatments, products, and staff members
- **Price Auto-fill**: Prices automatically populate based on service selection
- **Transaction Notes**: Optional notes field for visit details

## Key Design Principles

1. **User-Centric**: Simple, intuitive interface for all user demographics
2. **Security-First**: Encrypted authentication, secure session management, no plain-text passwords
3. **Scalability**: Designed to grow with SkinZone's customer base
4. **Offline-Capable**: Core features work offline with automatic sync
5. **Accessibility**: Inclusive design accessible to all users
6. **Data Privacy**: GDPR-compliant, secure data handling

## Project Structure

```
SkinzoneProject/
├── app/                    # Screen components & navigation
│   ├── (tabs)/            # Bottom tab navigation screens (Customer)
│   │   ├── _layout.tsx    # Tab bar configuration
│   │   ├── Home.tsx       # Home dashboard with points & notifications
│   │   ├── CustomerProfile.tsx  # User profile with image upload
│   │   └── HistoryPage.tsx # Visit history & transaction logs
│   ├── (Admintab)/        # Staff dashboard screens
│   │   ├── _layout.tsx    # Admin tab configuration
│   │   ├── StaffDashBoard.tsx  # Customer management interface
│   │   ├── StaffProfile.tsx    # Staff profile screen
│   │   └── AddTreatment.tsx    # Add treatments & products
│   ├── index.tsx          # Root entry point
│   ├── Login.tsx          # Login screen with Supabase auth
│   ├── SignUp.tsx         # Registration with validation
│   ├── ChangePassword.tsx # Password change functionality
│   ├── ResetPassword.tsx  # Password recovery
│   ├── TermsOfService.tsx # Terms & conditions
│   ├── PrivacyPolicy.tsx  # Privacy policy
│   └── _layout.tsx        # Route configuration
├── components/            # Reusable UI components
│   ├── Input.tsx          # Text input with validation
│   ├── PasswordInput.tsx  # Password field with toggle
│   ├── DatePicker.tsx     # Date selection component
│   ├── EditModal.tsx      # Profile edit modal
│   ├── ProfileImage.tsx   # User avatar with upload
│   ├── CustomerModal.tsx  # Add visit/product modal (Staff)
│   ├── FreeVisit.tsx      # Free visit claiming interface
│   ├── Visitation.tsx     # Visit history display
│   ├── Customer.tsx       # Customer card component
│   ├── DropDownInput.tsx  # Dropdown selection component
│   ├── SearchBar.tsx      # Customer search functionality
│   ├── PrimaryButton.tsx  # Primary action button
│   ├── PrimaryText.tsx    # Typography component
│   ├── TabBar.tsx         # Custom tab bar
│   └── utils/             # Utility functions & types
│       ├── Colours.ts     # Color palette
│       ├── GetServices.ts # Fetch treatments & products
│       ├── GetUserData.ts # User data & points calculations
│       ├── GetUsersession.ts # Session management
│       └── DatabaseTypes.ts  # TypeScript types
├── lib/
│   ├── supabase.ts        # Supabase client initialization
│   ├── imageUpload.ts     # Image upload & storage handling
│   ├── notifications.ts   # Notification system
│   └── cache.ts           # Caching system with invalidation
├── supabase/
│   └── storage_policies.sql # Storage RLS policies
├── assets/                # Images & static files
├── .env                   # Environment variables (Supabase keys)
├── .gitignore            # Git ignore rules
├── app.json              # Expo configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## License & Usage Terms

⚠️ **PROPRIETARY SOFTWARE** ⚠️

This project is the **exclusive intellectual property of SkinZone** and is not open-source.

### Usage Restrictions

**This code cannot be used, modified, distributed, or deployed without explicit written consent from the project owner.**

- ❌ No copying or redistribution
- ❌ No commercial use without authorization
- ❌ No modification or reverse engineering
- ❌ No use as a template or reference for competing products

### Authorized Users

Only individuals and teams explicitly authorized by SkinZone in writing may:

- Access this repository
- View or modify the codebase
- Deploy or run the application
- Contribute to development

### License

All code, designs, documentation, and assets are protected under **Copyright © 2025 SkinZone**. Unauthorized use will be pursued legally.

### For Authorization Inquiries

To request access, licensing, or usage permissions, please contact:

- **Project Owner**: [Itumeleng Morena](mailto:itumelengmorena20@gmail.com)

---

## Data Protection & Privacy

This application collects and processes personal data including:

- Email addresses
- Phone numbers
- Date of birth
- Treatment history

All data is:

- Encrypted in transit and at rest
- Stored securely in Supabase
- Protected by authentication and authorization
- Compliant with data protection regulations

Users' personal information is **never shared with third parties** without explicit consent.

---

## Future Roadmap

- [x] Real-time notifications for visits and promotions
- [x] Profile picture upload with storage
- [x] Points system with free visit claiming
- [x] Staff dashboard for customer management
- [x] Product sales tracking
- [ ] Real-time sync for profile updates across devices
- [ ] Multi-language support (English, Afrikaans, Zulu)
- [ ] Appointment booking system
- [ ] Payment integration for package purchases
- [ ] SMS/Email notifications for appointments & promotions
- [ ] Advanced analytics dashboard (admin side)
- [ ] API for third-party integrations
- [ ] Mobile app store publication (iOS/Android)
- [ ] Staff mobile app for visit verification
- [ ] Multi-branch support
- [ ] Loyalty tier system (Silver, Gold, Platinum)
- [ ] Referral program tracking
- [ ] In-app chat/support
- [ ] Offline mode improvements
- [ ] Biometric authentication (Face ID/Fingerprint)

---

**Last Updated**: January 7, 2026  
**Project Status**: Active Development (Phase 1 → Phase 2 Transition)
