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
- **User Profiles**: Centralized customer data with editable fields (name, surname, email, phone, date of birth)
- **Profile Management**: Full CRUD operations on user data with validation
- **Password Management**: Secure password change and reset functionality
- **Home Dashboard**: Personalized welcome screen showing user name, balance, and recent visits
- **History Tracking**: View past visitations with service details and points earned
- **Session Persistence**: Automatic login state management across app restarts
- **Input Validation**: Real-time validation for email addresses, phone numbers, and passwords
- **Profile Images**: User avatar support with image upload capability
- **Real-Time Notifications**: Alert customers of loyalty milestones and promotions (future phase)
- **Admin Dashboard**: Staff access to manage customers, verify visits, and track metrics (future phase)
- **Appointment Booking**: Integrated scheduling system (planned for Phase 2)
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
- ✅ Profile image support
- ✅ Customer Profile screen with editable fields
- ✅ Home screen with welcome dashboard
- ✅ History/Visitations tracking UI
- ✅ Bottom tab navigation
- ✅ Input validation (email, phone, password)
- ✅ Supabase database integration
- ✅ Session management

### Phase 2 (In Progress)

- 🚧 Loyalty points accumulation and tracking
- 🚧 Visit history with detailed records
- 🚧 Balance/points display system
- ⏳ Appointment booking system
- ⏳ Admin/staff dashboard
- ⏳ Visit verification workflow

### Phase 3 (Planned)

- Analytics & reporting
- Marketing automation
- SMS/push notifications
- Customer insights & behavior analytics

## Technology Stack

- **Frontend Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend & Auth**: Supabase (PostgreSQL + Authentication)
- **Navigation**: Expo Router with bottom tabs
- **State Management**: React Hooks + Async Storage
- **UI Components**: Custom reusable component library
- **Icons**: Lucide React Native
- **Image Handling**: Expo Image Picker
- **Security**: Supabase Auth with email verification
- **Form Validation**: Custom validation for email, phone, and password fields
- **Date Handling**: React Native DateTimePicker

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
│   ├── (tabs)/            # Bottom tab navigation screens
│   │   ├── _layout.tsx    # Tab bar configuration
│   │   ├── Home.tsx       # Home dashboard with balance & visits
│   │   ├── CustomerProfile.tsx  # User profile screen
│   │   └── History.tsx    # Visit history & logs
│   ├── index.tsx          # Root entry point
│   ├── Login.tsx          # Login screen with Supabase auth & icons
│   ├── SignUp.tsx         # Registration with validation
│   ├── ChangePassword.tsx # Password change functionality
│   ├── ResetPassword.tsx  # Password recovery
│   └── _layout.tsx        # Route configuration
├── components/            # Reusable UI components
│   ├── Input.tsx          # Text input with user icon & validation
│   ├── PasswordInput.tsx  # Password field with lock & eye toggle
│   ├── DatePicker.tsx     # Date selection component
│   ├── EditModal.tsx      # Profile edit modal with validation
│   ├── ProfileImage.tsx   # User avatar with image picker
│   ├── PrimaryButton.tsx  # Primary action button
│   ├── PrimaryText.tsx    # Typography component
│   ├── TabBar.tsx         # Custom tab bar component
│   └── utils/             # Utilities (colors, helpers)
├── lib/
│   └── supabase.ts        # Supabase client initialization
├── assets/                # Images & static files
├── .env                   # Environment variables (Supabase keys)
├── app.json              # Expo configuration
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

- [ ] Real-time sync for profile updates across devices
- [ ] Multi-language support (English, Afrikaans, Zulu)
- [ ] Payment integration for package purchases
- [ ] SMS/Email notifications for appointments & promotions
- [ ] Advanced analytics dashboard (admin side)
- [ ] API for third-party integrations
- [ ] Mobile app store publication (iOS/Android)
- [ ] Staff mobile app for visit verification
- [ ] Loyalty tier system (Silver, Gold, Platinum)
- [ ] Referral program tracking
- [ ] In-app chat/support
- [ ] Offline mode improvements
- [ ] Biometric authentication (Face ID/Fingerprint)

---

**Last Updated**: January 7, 2026  
**Project Status**: Active Development (Phase 1 → Phase 2 Transition)
