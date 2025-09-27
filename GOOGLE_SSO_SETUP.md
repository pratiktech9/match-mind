# Google Single Sign-On (SSO) Setup Guide

This application uses Google OAuth 2.0 for authentication, allowing only internal users to access the system.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console
3. A Google Workspace domain (optional, for domain restriction)

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/google_oauth2/callback`
     - For production: `https://yourdomain.com/auth/google_oauth2/callback`
   - Save and copy the Client ID and Client Secret

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your Google OAuth credentials:
   ```bash
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```

3. Optional: Restrict access to your company domain:
   ```bash
   GOOGLE_HD_DOMAIN=yourcompany.com
   ALLOWED_EMAIL_DOMAINS=yourcompany.com
   ```

### 3. Install Dependencies

```bash
bundle install
```

### 4. Run Database Migrations

```bash
rails db:migrate
```

### 5. Start the Application

```bash
rails server
```

## Security Features

### Domain Restriction
- **GOOGLE_HD_DOMAIN**: Restricts Google OAuth to users from a specific Google Workspace domain
- **ALLOWED_EMAIL_DOMAINS**: Additional email domain validation (comma-separated list)

### Access Control
- Only users with emails from allowed domains can access the application
- Users are automatically created on first login
- Session-based authentication with secure token storage

## Usage

1. Visit the application in your browser
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. If your email domain is allowed, you'll be logged in
5. If not, you'll see an "Access denied" message

## Troubleshooting

### Common Issues

1. **"Access denied" error**:
   - Check that your email domain is in `ALLOWED_EMAIL_DOMAINS`
   - Verify `GOOGLE_HD_DOMAIN` is set correctly

2. **OAuth redirect error**:
   - Ensure redirect URI in Google Console matches your application URL
   - Check that the callback route is properly configured

3. **Environment variables not loading**:
   - Ensure `.env` file is in the project root
   - Restart the Rails server after changing environment variables

### Development vs Production

- **Development**: Use `http://localhost:3000` for redirect URIs
- **Production**: Use your actual domain with HTTPS
- Update Google Console settings accordingly

## API Endpoints

- `GET /auth/google_oauth2` - Initiate Google OAuth
- `GET /auth/google_oauth2/callback` - OAuth callback
- `GET /auth/failure` - OAuth failure handler
- `DELETE /logout` - Logout user
- `GET /api/current_user` - Get current user info (for React app)

## User Model

The User model stores:
- `provider`: OAuth provider (google_oauth2)
- `uid`: Google user ID
- `name`: User's full name
- `email`: User's email address
- `image_url`: User's profile picture
- `role`: User role (default: 'user')
- `token`: OAuth access token
- `token_expires_at`: Token expiration time
