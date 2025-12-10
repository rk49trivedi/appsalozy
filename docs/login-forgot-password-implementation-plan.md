# Login & Forgot Password Implementation Plan

## Overview

This document outlines the complete implementation plan for enhancing the login page and implementing forgot password functionality in the Salozy mobile application. The implementation includes creating necessary API endpoints in the web application and building the mobile app screens.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [Technical Details](#technical-details)
5. [File Structure](#file-structure)
6. [Testing Strategy](#testing-strategy)

---

## Current State Analysis

### Mobile Application (F:\mobile\salozy)

**Login Page (`app/login.tsx`):**
- ✅ Basic login form with email and password fields
- ✅ Remember me checkbox
- ✅ "Forgot?" button exists but **NOT FUNCTIONAL** (no onPress handler)
- ✅ Email verification resend functionality
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states

**API Client (`lib/api/client.ts`):**
- ✅ Login method implemented
- ✅ Logout method implemented
- ✅ Profile method implemented
- ❌ **Missing**: Forgot password method
- ❌ **Missing**: Reset password method

**API Config (`lib/api/config.ts`):**
- ❌ **Missing**: Forgot password endpoint
- ❌ **Missing**: Reset password endpoint

### Web Application (D:\projects\www\salozy)

**Existing Web Routes:**
- ✅ `GET /auth/forgot-password` - Shows forgot password form
- ✅ `POST /auth/forgot-password` - Sends password reset link
- ✅ `GET /auth/reset-password/{token}` - Shows reset password form
- ✅ `POST /auth/reset-password` - Resets password

**Existing Controllers:**
- ✅ `PasswordResetLinkController` - Handles forgot password requests
- ✅ `NewPasswordController` - Handles password reset

**API Routes:**
- ❌ **Missing**: API endpoints for forgot password
- ❌ **Missing**: API endpoints for reset password

---

## Architecture Overview

### Password Reset Flow

```
User Clicks "Forgot?" on Login Screen
    ↓
Navigate to Forgot Password Screen
    ↓
User Enters Email
    ↓
POST /api/forgot-password
    ↓
Backend generates token & sends email
    ↓
Email contains: https://salozy.com/auth/reset-password/{token}?email={email}
    ↓
User clicks link in email
    ↓
Web Route: /auth/reset-password/{token}
    ↓
Detect Mobile App Availability (Optional Enhancement)
    ├─→ Mobile App Installed?
    │   ├─→ YES: Redirect to salozy://auth/reset-password/{token}?email={email}
    │   │       ↓
    │   │   Mobile App Opens
    │   │       ↓
    │   │   Extract token & email
    │   │       ↓
    │   │   Navigate to Reset Password Screen
    │   │       ↓
    │   │   User enters new password
    │   │       ↓
    │   │   POST /api/reset-password
    │   │       ↓
    │   │   Navigate to Login Screen
    │   │
    │   └─→ NO: Show Web Reset Password Page
    │           ↓
    │       User resets password on web
    │           ↓
    │       Redirect to Web Login
```

**Note:** For initial implementation, we'll use a simpler approach where the email link opens the web page, and users can manually enter the token in the mobile app if needed. Deep linking can be added later as an enhancement.

---

## Implementation Phases

### Phase 1: Backend API Endpoints

#### 1.1 Create Forgot Password API Endpoint

**File**: `D:\projects\www\salozy\routes\api.php`

Add to public routes section:
```php
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
```

**File**: `D:\projects\www\salozy\app\Http\Controllers\Api\AuthController.php`

Add new method:
- `forgotPassword(Request $request)`: Handle forgot password request
  - Validate email (required, email format)
  - Find user by email
  - Generate password reset token (64 characters)
  - Store token in `password_reset_tokens` table (hashed)
  - Send password reset email
  - Return JSON response with success message
  - **Security**: Always return success message (don't reveal if email exists)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "A reset link will be sent if the account exists."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

#### 1.2 Create Reset Password API Endpoint

**File**: `D:\projects\www\salozy\routes\api.php`

Add to public routes section:
```php
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
```

**File**: `D:\projects\www\salozy\app\Http\Controllers\Api\AuthController.php`

Add new method:
- `resetPassword(Request $request)`: Handle password reset
  - Validate: `token` (required), `email` (required, email), `password` (required, confirmed, Rules\Password::defaults())
  - Find password reset token in database
  - Check if token exists
  - Check if token is expired (60 minutes)
  - Verify token hash matches
  - Find user by email
  - Update user password
  - Delete password reset token
  - Fire password reset event
  - Return JSON response with success message
  - **Important**: Do NOT auto-login user (mobile will handle login separately)

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "email": "user@example.com",
  "password": "new-password",
  "password_confirmation": "new-password"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Your password has been reset successfully!"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "This password reset token is invalid.",
  "errors": {
    "email": ["This password reset token is invalid."]
  }
}
```

```json
{
  "success": false,
  "message": "This password reset token has expired.",
  "errors": {
    "email": ["This password reset token has expired."]
  }
}
```

---

### Phase 2: Mobile Application - API Client Updates

#### 2.1 Update API Config

**File**: `F:\mobile\salozy\lib\api\config.ts`

Add new endpoints:
```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
};
```

#### 2.2 Update API Client

**File**: `F:\mobile\salozy\lib\api\client.ts`

Add new methods to `ApiClient` class:

```typescript
// Forgot password
async forgotPassword(email: string): Promise<ApiResponse> {
  return this.post('/forgot-password', { email }, false);
}

// Reset password
async resetPassword(data: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<ApiResponse> {
  return this.post('/reset-password', data, false);
}
```

---

### Phase 3: Mobile Application - UI Screens

#### 3.1 Create Forgot Password Screen

**File**: `F:\mobile\salozy\app\auth\forgot-password.tsx`

**Features:**
- Email input field
- Submit button
- Loading state
- Success message display
- Back to login link
- Error handling
- Form validation
- Mobile-optimized design matching login page style

**Design Reference:**
- Use same design language as login page
- Gradient background
- Card component
- Input component with email icon
- Button component with loading state
- Toast notifications for errors

#### 3.2 Create Reset Password Screen

**File**: `F:\mobile\salozy\app\auth\reset-password.tsx`

**Features:**
- Token input field (from URL params or manual entry)
- Email input field (from URL params or manual entry)
- New password input field
- Confirm password input field
- Password visibility toggle
- Submit button
- Loading state
- Success message display
- Back to login link
- Error handling
- Form validation
- Mobile-optimized design matching login page style

**URL Parameters:**
- `token`: Password reset token (optional, can be entered manually)
- `email`: User email (optional, can be entered manually)

**Design Reference:**
- Use same design language as login page
- Gradient background
- Card component
- Input components with icons
- Button component with loading state
- Toast notifications for errors

#### 3.3 Update Login Screen

**File**: `F:\mobile\salozy\app\login.tsx`

**Changes:**
- Add `onPress` handler to "Forgot?" button
- Navigate to `/auth/forgot-password` when clicked

**Line 268-274:**
```typescript
<TouchableOpacity
  onPress={() => router.push('/auth/forgot-password')}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Text size="base" weight="semibold" variant="primaryBrand">
    Forgot?
  </Text>
</TouchableOpacity>
```

---

## Technical Details

### Password Reset Token Security

1. **Token Generation**: 64-character random string using `Str::random(64)`
2. **Token Storage**: Hashed using `Hash::make()` before storing in database
3. **Token Verification**: Use `Hash::check()` to verify token
4. **Token Expiration**: 60 minutes from creation
5. **Token Cleanup**: Delete token after successful password reset

### Email Template

The password reset email will contain:
- Reset link: `https://salozy.com/auth/reset-password/{token}?email={email}`
- Expiration notice (60 minutes)
- Security notice (ignore if not requested)

### Error Handling

**Mobile App:**
- Network errors: Show toast with retry option
- Validation errors: Display inline errors
- Token errors: Show clear message with option to request new link
- Success: Show success message and navigate to login

**Backend:**
- Always return consistent success message for forgot password (security)
- Return specific error messages for reset password (user needs to know why it failed)

### Form Validation

**Forgot Password:**
- Email: Required, valid email format

**Reset Password:**
- Token: Required
- Email: Required, valid email format
- Password: Required, minimum 8 characters, confirmed
- Password confirmation: Must match password

---

## File Structure

### Backend (Web Application)

```
D:\projects\www\salozy\
├── routes\
│   └── api.php                          # Add forgot/reset password routes
├── app\
│   └── Http\
│       └── Controllers\
│           └── Api\
│               └── AuthController.php   # Add forgotPassword() and resetPassword() methods
└── app\
    └── Mail\
        └── PasswordResetMail.php        # Already exists, no changes needed
```

### Mobile Application

```
F:\mobile\salozy\
├── app\
│   ├── login.tsx                        # Update: Add onPress to Forgot button
│   └── auth\
│       ├── forgot-password.tsx          # New: Forgot password screen
│       └── reset-password.tsx           # New: Reset password screen
├── lib\
│   └── api\
│       ├── config.ts                    # Update: Add endpoints
│       └── client.ts                    # Update: Add methods
└── docs\
    └── login-forgot-password-implementation-plan.md  # This file
```

---

## Testing Strategy

### Backend API Testing

1. **Forgot Password API:**
   - ✅ Valid email (existing user) - should send email
   - ✅ Valid email (non-existing user) - should return success (security)
   - ✅ Invalid email format - should return validation error
   - ✅ Missing email - should return validation error

2. **Reset Password API:**
   - ✅ Valid token and email - should reset password
   - ✅ Invalid token - should return error
   - ✅ Expired token - should return error
   - ✅ Invalid email - should return error
   - ✅ Weak password - should return validation error
   - ✅ Password mismatch - should return validation error
   - ✅ Missing fields - should return validation errors

### Mobile App Testing

1. **Forgot Password Screen:**
   - ✅ Navigate from login page
   - ✅ Submit with valid email
   - ✅ Submit with invalid email format
   - ✅ Submit with empty email
   - ✅ Success message display
   - ✅ Error handling
   - ✅ Back to login navigation

2. **Reset Password Screen:**
   - ✅ Navigate with token and email in URL
   - ✅ Manual token and email entry
   - ✅ Submit with valid data
   - ✅ Submit with invalid token
   - ✅ Submit with expired token
   - ✅ Submit with weak password
   - ✅ Submit with mismatched passwords
   - ✅ Password visibility toggle
   - ✅ Success message and navigation to login
   - ✅ Error handling

3. **Login Screen:**
   - ✅ "Forgot?" button navigates to forgot password screen

### Integration Testing

1. **Complete Flow:**
   - Request password reset from mobile app
   - Check email for reset link
   - Click link (opens web page)
   - Copy token and email
   - Enter in mobile app reset password screen
   - Reset password successfully
   - Login with new password

---

## Implementation Checklist

### Backend (Web Application)

- [ ] Add `POST /api/forgot-password` route
- [ ] Implement `forgotPassword()` method in `AuthController`
- [ ] Add `POST /api/reset-password` route
- [ ] Implement `resetPassword()` method in `AuthController`
- [ ] Test API endpoints with Postman/Thunder Client
- [ ] Verify email sending functionality

### Mobile Application

- [ ] Update `API_ENDPOINTS` in `config.ts`
- [ ] Add `forgotPassword()` method to `ApiClient`
- [ ] Add `resetPassword()` method to `ApiClient`
- [ ] Create `app/auth/forgot-password.tsx` screen
- [ ] Create `app/auth/reset-password.tsx` screen
- [ ] Update login screen "Forgot?" button
- [ ] Test forgot password flow
- [ ] Test reset password flow
- [ ] Test error handling
- [ ] Test form validation
- [ ] Verify UI matches design language

---

## Future Enhancements

1. **Deep Linking for Password Reset:**
   - Modify email to use universal link handler
   - Auto-detect mobile app and redirect to deep link
   - Auto-populate token and email in mobile app

2. **Token Input via QR Code:**
   - Generate QR code on web reset page
   - Scan QR code in mobile app
   - Auto-populate token and email

3. **Biometric Authentication:**
   - After password reset, offer to enable biometric login
   - Store credentials securely

4. **Password Strength Indicator:**
   - Real-time password strength feedback
   - Visual indicator (weak/medium/strong)

---

## Notes

- The initial implementation uses a manual token entry approach for simplicity
- Deep linking can be added later as an enhancement
- The web application's existing password reset functionality remains unchanged
- All API endpoints follow RESTful conventions
- Security best practices are followed (token hashing, expiration, etc.)

