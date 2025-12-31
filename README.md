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
- **User Profiles**: Centralized customer data including personal information, treatment history, and loyalty points
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

### Phase 1 (Current)

- Authentication (Login, Sign Up, Password Reset)
- Basic user profile creation
- Foundation for loyalty tracking

### Phase 2 (Planned)

- Appointment booking system
- Loyalty points accumulation and redemption
- Admin/staff dashboard
- Visit verification workflow

### Phase 3 (Planned)

- Analytics & reporting
- Marketing automation
- SMS/push notifications
- Customer insights & behavior analytics

## Technology Stack

- **Frontend Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend & Auth**: Supabase (PostgreSQL + Authentication)
- **Navigation**: Expo Router
- **State Management**: React Hooks + Async Storage
- **UI Components**: Custom reusable component library
- **Security**: Supabase Auth with email verification

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
│   ├── index.tsx          # Root entry point
│   ├── Login.tsx          # Login screen with Supabase auth
│   ├── SignUp.tsx         # Registration with validation
│   ├── ResetPassword.tsx  # Password recovery
│   └── _layout.tsx        # Route configuration
├── components/            # Reusable UI components
│   ├── Input.tsx          # Text input with validation
│   ├── PasswordInput.tsx   # Password field with toggle
│   ├── DatePicker.tsx     # Date selection component
│   ├── PrimaryButton.tsx  # Primary action button
│   ├── PrimaryText.tsx    # Typography component
│   └── utils/             # Utilities (colors, etc.)
├── lib/
│   └── supabase.ts        # Supabase client initialization
├── .env                   # Environment variables
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

- [ ] Multi-language support
- [ ] Payment integration for package purchases
- [ ] SMS/Email notifications
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Mobile app store publication (iOS/Android)
- [ ] Staff mobile app for visit verification
- [ ] Loyalty tier system (Silver, Gold, Platinum)
- [ ] Referral program tracking

---

**Last Updated**: December 31, 2025  
**Project Status**: Active Development (Phase 1)
