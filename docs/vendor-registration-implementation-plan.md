# Vendor Registration & Email Verification Implementation Plan

## Overview

This document outlines the complete implementation plan for vendor registration and email verification in the Salozy mobile application, using a Universal Link Handler approach that intelligently detects mobile app availability and redirects accordingly.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Phases](#implementation-phases)
3. [Technical Details](#technical-details)
4. [File Structure](#file-structure)
5. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Universal Link Handler Approach

The implementation uses a **Universal Link Handler** that:

1. **Email contains web URL**: All verification emails contain a standard web URL (`https://salozy.com/auth/verify-email/{token}?email={email}`)
2. **Web route detects mobile app**: When the link is clicked, a web route checks if the mobile app is installed
3. **Smart redirection**:
   - If mobile app is installed → Redirect to deep link (`salozy://auth/verify-email/{token}?email={email}`)
   - If mobile app is not installed → Show web verification page
4. **Mobile app handles deep link**: Mobile app processes the deep link, verifies email via API, and navigates to login

### Flow Diagram

```
User Registers (Mobile App)
    ↓
POST /api/register-vendor
    ↓
Backend creates user & sends email
    ↓
Email contains: https://salozy.com/auth/verify-email/{token}?email={email}
    ↓
User clicks link in email
    ↓
Web Route: /auth/verify-email/{token}
    ↓
Detect Mobile App Availability
    ├─→ Mobile App Installed?
    │   ├─→ YES: Redirect to salozy://auth/verify-email/{token}?email={email}
    │   │       ↓
    │   │   Mobile App Opens
    │   │       ↓
    │   │   Extract token & email
    │   │       ↓
    │   │   POST /api/verify-email
    │   │       ↓
    │   │   Navigate to Login Screen
    │   │
    │   └─→ NO: Show Web Verification Page
    │           ↓
    │       Verify & Auto-login
    │           ↓
    │       Redirect to Web Dashboard/Login
```

---

## Implementation Phases

### Phase 1: Backend API Endpoints

#### 1.1 Create Vendor Registration API Endpoint

**File**: `D:\projects\www\salozy\routes\api.php`

Add to public routes section:
```php
Route::post('/register-vendor', [AuthController::class, 'registerVendor']);
```

**File**: `D:\projects\www\salozy\app\Http\Controllers\Api\AuthController.php`

Add new method:
- `registerVendor(Request $request)`: Handle vendor registration
  - Validate all fields (same as web form, excluding plan_id)
  - Create tenant, domain, user, branch
  - Assign vendor role
  - Send verification email
  - Return JSON response with success message
  - **Important**: Do NOT auto-login user
  - **Note**: Do NOT handle plan_id. Plan purchase will be implemented separately after registration.

**Fields to validate:**
- `name` (required, string, max:255)
- `email` (required, string, lowercase, email, max:255, unique)
- `password` (required, confirmed, Rules\Password::defaults())
- `company_name` (required, string, max:255)
- `company_domain` (required, string, max:255, regex, unique)

**Note:** Plan purchase will be handled separately after registration. Users will be redirected to purchase plan page after first-time registration (to be implemented in future phase).

#### 1.2 Create Email Verification API Endpoint

**File**: `D:\projects\www\salozy\routes\api.php`

Add to public routes section:
```php
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
```

**File**: `D:\projects\www\salozy\app\Http\Controllers\Api\AuthController.php`

Add new method:
- `verifyEmail(Request $request)`: Handle email verification via API
  - Accept `token` and `email` in request body
  - Validate token (same logic as web controller)
  - Mark email as verified
  - Return JSON response with success message
  - **Important**: Do NOT auto-login user (mobile will handle login separately)

#### 1.3 Modify Email Verification Web Route

**File**: `D:\projects\www\salozy\routes\web.php`

Modify existing route to detect mobile app:
```php
Route::get('/auth/verify-email/{token}', [EmailVerificationController::class, 'verify'])
    ->name('verify.email');
```

**File**: `D:\projects\www\salozy\app\Http\Controllers\Auth\EmailVerificationController.php`

Modify `verify()` method:
1. Check if request is from mobile app (User-Agent detection or query parameter)
2. If mobile app detected:
   - Generate deep link URL: `salozy://auth/verify-email/{token}?email={email}`
   - Redirect to deep link
3. If web browser:
   - Continue with existing web verification flow
   - Auto-login and redirect to dashboard/login

**Mobile Detection Strategy:**
- Check User-Agent for mobile app identifiers
- Check for `?mobile=1` query parameter (optional, for testing)
- Use JavaScript to detect if mobile app can handle the deep link

#### 1.4 Create Universal Link Handler Route

**File**: `D:\projects\www\salozy\routes\web.php`

Add new route:
```php
Route::get('/auth/verify-email/universal/{token}', [EmailVerificationController::class, 'universalVerify'])
    ->name('verify.email.universal');
```

**File**: `D:\projects\www\salozy\app\Http\Controllers\Auth\EmailVerificationController.php`

Add new method:
- `universalVerify(Request $request, string $token)`: Universal link handler
  - Extract email from query parameter
  - Detect mobile app availability using JavaScript
  - If mobile app available: Redirect to deep link
  - If not: Redirect to web verification page
  - Return HTML page with JavaScript for detection

**Detection JavaScript:**
```javascript
// Try to open deep link
window.location.href = 'salozy://auth/verify-email/{token}?email={email}';

// Fallback: If app doesn't open within timeout, redirect to web
setTimeout(() => {
    window.location.href = '/auth/verify-email/{token}?email={email}';
}, 1000);
```

---

### Phase 2: Mobile App - Vendor Registration

#### 2.1 Create Registration Screen

**File**: `F:\mobile\salozy\app\register-vendor.tsx`

Create new screen with:
- Form fields matching web application:
  - Name (text input)
  - Email (email input)
  - Password (secure text input with show/hide toggle)
  - Confirm Password (secure text input with show/hide toggle)
  - Company Name (text input)
  - Company Domain (text input with validation)
- Form validation
- Error handling
- Loading states
- Success message
- Navigation to login screen after successful registration

**Note:** Plan purchase functionality will be implemented separately. After registration, users will be redirected to purchase plan page (future implementation).

**Design Guidelines:**
- Follow mobile.md instruction: "design reference from web application but if you can better recommendation layout as per mobile view than do your best"
- Use existing mobile components (Input, Button, Card, Text)
- Mobile-optimized layout (single column, proper spacing)
- Match color scheme and styling from login screen
- Add domain preview (show full subdomain: `{domain}.salozy.com`)

#### 2.2 Add Registration Method to API Client

**File**: `F:\mobile\salozy\lib\api\client.ts`

Add new method:
```typescript
async registerVendor(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  company_domain: string;
}): Promise<ApiResponse>
```

**Note:** `plan_id` is not included in registration. Plan purchase will be handled separately after registration.

**Implementation:**
- POST to `/api/register-vendor`
- Handle validation errors
- Return success/error response
- Do NOT store token (user must verify email first)

#### 2.3 Update API Config

**File**: `F:\mobile\salozy\lib\api\config.ts`

Add endpoint constant:
```typescript
REGISTER_VENDOR: '/register-vendor',
VERIFY_EMAIL: '/verify-email',
```

---

### Phase 3: Mobile App - Deep Link Handling

#### 3.1 Configure Deep Link Listener

**File**: `F:\mobile\salozy\app\_layout.tsx`

Add deep link handling:
- Import `expo-linking`
- Set up listener for deep links
- Handle `salozy://auth/verify-email/*` links
- Extract token and email from URL
- Navigate to verification screen

**Implementation:**
```typescript
import * as Linking from 'expo-linking';

useEffect(() => {
  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url);
    }
  });

  // Handle deep links while app is running
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url);
  });

  return () => {
    subscription.remove();
  };
}, []);
```

#### 3.2 Create Email Verification Screen

**File**: `F:\mobile\salozy\app\auth\verify-email.tsx`

Create new screen to:
- Accept token and email from deep link or route params
- Show loading state while verifying
- Call verification API
- Display success/error messages
- Navigate to login screen on success
- Handle expired/invalid tokens

**Screen Flow:**
1. Extract token and email from URL params
2. Show "Verifying email..." message
3. Call `apiClient.verifyEmail(token, email)`
4. On success: Show success message, navigate to login
5. On error: Show error message, provide option to resend verification email

#### 3.3 Add Verification Method to API Client

**File**: `F:\mobile\salozy\lib\api\client.ts`

Add new method:
```typescript
async verifyEmail(token: string, email: string): Promise<ApiResponse>
```

**Implementation:**
- POST to `/api/verify-email`
- Send token and email in request body
- Handle success/error responses
- Do NOT store token (user must login separately)

---

### Phase 4: Mobile App - Navigation Updates

#### 4.1 Update Login Screen

**File**: `F:\mobile\salozy\app\login.tsx`

Add:
- Link to registration screen: "Don't have an account? Sign Up"
- Handle success message from registration (if passed via route params)
- Display email verification message if user just registered

#### 4.2 Update Root Layout

**File**: `F:\mobile\salozy\app\_layout.tsx`

Ensure deep link handling is properly integrated with navigation

---

## Technical Details

### Token Format

The verification token is base64 encoded and contains:
```
base64_encode(email|timestamp|app_key)
```

**Validation:**
- Decode token
- Split by `|`
- Verify email matches
- Verify timestamp is within 24 hours
- Verify key matches `config('app.key')`

### Deep Link URL Format

**Mobile Deep Link:**
```
salozy://auth/verify-email/{token}?email={email}
```

**Web URL:**
```
https://salozy.com/auth/verify-email/{token}?email={email}
```

### Mobile App Detection

**Strategy 1: User-Agent Detection**
- Check if User-Agent contains mobile app identifier
- Less reliable, can be spoofed

**Strategy 2: JavaScript Detection**
- Try to open deep link
- If app opens, user is redirected
- If app doesn't open within timeout, fallback to web
- More reliable for actual app detection

**Strategy 3: Query Parameter**
- Add `?mobile=1` to registration request
- Store flag in user record
- Use flag when generating email link
- Most reliable but requires tracking

**Recommended: Combination of Strategy 2 and 3**
- Use JavaScript detection for immediate response
- Use query parameter for future emails

### Error Handling

**Registration Errors:**
- Validation errors (field-specific)
- Email already exists
- Domain already taken
- Network errors
- Server errors

**Verification Errors:**
- Invalid token
- Expired token
- Email already verified
- User not found
- Network errors

### Security Considerations

1. **Token Security:**
   - Tokens expire after 24 hours
   - Tokens are single-use (mark email as verified)
   - Tokens include app key for validation

2. **API Security:**
   - Registration endpoint is public (required)
   - Verification endpoint is public (required)
   - Rate limiting should be applied
   - CSRF protection for web routes

3. **Deep Link Security:**
   - Validate token on mobile app side
   - Don't trust client-side validation alone
   - Always verify on server

---

## File Structure

### Backend Files (Web Application)

```
D:\projects\www\salozy\
├── routes\
│   ├── api.php                    # Add registration & verification routes
│   └── web.php                    # Modify verification route
├── app\
│   ├── Http\
│   │   └── Controllers\
│   │       ├── Api\
│   │       │   └── AuthController.php    # Add registerVendor() & verifyEmail()
│   │       └── Auth\
│   │           └── EmailVerificationController.php    # Modify verify(), add universalVerify()
│   └── Mail\
│       └── EmailVerificationMail.php    # Keep as-is (uses web URL)
```

### Mobile App Files

```
F:\mobile\salozy\
├── app\
│   ├── _layout.tsx                # Add deep link handling
│   ├── register-vendor.tsx        # NEW: Registration screen
│   ├── auth\
│   │   └── verify-email.tsx       # NEW: Verification screen
│   └── login.tsx                  # Update: Add registration link
├── lib\
│   └── api\
│       ├── client.ts              # Add registerVendor() & verifyEmail()
│       └── config.ts              # Add endpoint constants
└── docs\
    └── vendor-registration-implementation-plan.md    # This file
```

---

## Testing Strategy

### Phase 1: Backend API Testing

1. **Registration API:**
   - Test successful registration
   - Test validation errors
   - Test duplicate email
   - Test duplicate domain
   - Verify email is sent

2. **Verification API:**
   - Test successful verification
   - Test invalid token
   - Test expired token
   - Test already verified email

3. **Universal Link Handler:**
   - Test mobile app detection
   - Test web fallback
   - Test deep link generation

### Phase 2: Mobile App Testing

1. **Registration Screen:**
   - Test form validation
   - Test successful registration
   - Test error handling
   - Test navigation to login

2. **Deep Link Handling:**
   - Test deep link opens app
   - Test token extraction
   - Test verification flow
   - Test error handling

3. **Verification Screen:**
   - Test successful verification
   - Test error handling
   - Test navigation to login

### Phase 3: End-to-End Testing

1. **Complete Flow:**
   - Register from mobile app
   - Receive email
   - Click email link
   - Verify mobile app opens (if installed)
   - Verify email
   - Login successfully

2. **Web Fallback:**
   - Register from mobile app
   - Receive email
   - Click email link on device without app
   - Verify web page opens
   - Verify email on web
   - Login from mobile app

3. **Error Scenarios:**
   - Expired token
   - Invalid token
   - Network errors
   - Already verified email

---

## Implementation Checklist

### Backend (Web Application)

- [ ] Add `POST /api/register-vendor` route
- [ ] Implement `AuthController::registerVendor()` method
- [ ] Add `POST /api/verify-email` route
- [ ] Implement `AuthController::verifyEmail()` method
- [ ] Modify `EmailVerificationController::verify()` for mobile detection
- [ ] Add `EmailVerificationController::universalVerify()` method
- [ ] Test all API endpoints
- [ ] Test email sending
- [ ] Test token validation

### Mobile App

- [ ] Create `app/register-vendor.tsx` screen
- [ ] Add `registerVendor()` to API client
- [ ] Add `verifyEmail()` to API client
- [ ] Update API config with new endpoints
- [ ] Configure deep link handling in `app/_layout.tsx`
- [ ] Create `app/auth/verify-email.tsx` screen
- [ ] Update `app/login.tsx` with registration link
- [ ] Test registration flow
- [ ] Test deep link handling
- [ ] Test verification flow
- [ ] Test error handling
- [ ] Test navigation flows

### Documentation

- [ ] Update API documentation
- [ ] Update mobile app README
- [ ] Document deep link scheme
- [ ] Document error codes

---

## Notes

1. **Email Links**: All email links will use web URLs. The universal link handler will redirect to mobile app if available.

2. **User Experience**: Users registering from mobile will receive email with web link. When clicked:
   - If mobile app installed → Opens app and verifies
   - If mobile app not installed → Opens web page and verifies

3. **Backward Compatibility**: Existing web verification flow remains unchanged. Mobile app adds new capability without breaking existing functionality.

4. **Plan Purchase**: Plan purchase functionality will be implemented separately. After successful registration and email verification, users will be redirected to purchase plan page (to be implemented in future phase).

5. **Future Enhancements**:
   - Add universal links (iOS/Android) for better deep linking
   - Add push notifications for email verification
   - Add resend verification email from mobile app
   - Add email verification status check
   - Implement plan purchase flow after registration

---

## Questions & Clarifications

Before implementation, confirm:

1. **API Base URL**: Confirm the API base URL is `https://salozy.com/api` (from `lib/api/config.ts`)

2. **Email Template**: Should email template be modified to mention mobile app option?

3. **Auto-login**: Should mobile app auto-login after verification, or require manual login?

4. **Error Messages**: Should error messages match web application exactly, or be mobile-optimized?

5. **Plan Purchase**: Plan purchase functionality will be implemented in a separate phase after registration is complete.

---

## Conclusion

This implementation plan provides a complete solution for vendor registration and email verification in the mobile application, using a Universal Link Handler approach that seamlessly works for both mobile app and web users. The plan maintains backward compatibility while adding new mobile-specific functionality.

