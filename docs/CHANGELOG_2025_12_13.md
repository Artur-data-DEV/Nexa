# Changelog - 2025-12-13

## Summary
This update focuses on ensuring codebase compatibility with PHP 8.4 and modernizing the real-time chat architecture by migrating from Socket.io to Laravel Echo (Reverb). Additionally, the local development environment has been configured to support Google Authentication and WebSocket connectivity.

## Backend Changes (PHP 8.4 Compliance)
Addressed the "Implicitly nullable parameter" deprecation in PHP 8.4. Explicitly typed nullable parameters in the following files:

### Models
- `Contract.php`: Updated `terminate` and `cancel` methods.
- `Withdrawal.php`: Updated `createWithdrawalNotification` and `cancel` methods.
- `DeliveryMaterial.php`: Updated `approve` and `reject` methods.
- `Campaign.php`: Updated `reject` method.
- `CampaignApplication.php`: Updated `reject` method.
- `Offer.php`: Updated `reject` method.
- `JobPayment.php`: Updated `refund` method.
- `CampaignTimeline.php`: Updated `markAsApproved` and `markAsDelayed` methods.
- `User.php`: Updated `suspend` method.
- `UserOnlineStatus.php`: Updated `updateOnlineStatus` method.
- `DirectChatRoom.php`: Updated `findOrCreateRoom` method.
- `Notification.php`: Updated factory methods.

### Services
- `PaymentService.php`: Updated `syncSubscription` and `markSubscriptionPaymentFailed`.
- `NotificationService.php`: Updated multiple notification methods (e.g., `notifyBrandOfProjectStatus`, `notifyUserOfContractTerminated`).

### Events
- `NewMessage.php`: Updated constructor parameters.

### Repositories
- `WebhookEventRepository.php`: Updated `updateStatus` methods.

## Frontend Changes (WebSocket Migration)
Migrated the real-time chat client from `socket.io-client` to `laravel-echo` and `pusher-js` to align with the backend Laravel Reverb architecture.

### Components
- `Chat.tsx`:
  - Implemented message deduplication using a `Set` of message IDs.
  - Updated event listeners for `new_message`, `user_typing`, and `messages_read`.
  - Added logic for handling file attachments in real-time events.
  - Improved local feedback for offer acceptance.

### Hooks
- `useSocket.ts`:
  - Replaced Socket.io logic with `laravel-echo`.
  - Implemented Singleton pattern for Echo instance to prevent duplicate connections.
  - Configured private channels (`chat.{roomId}`) and user notification channels.
  - Added support for Whisper events (typing indicators).

### Configuration
- `package.json`: Removed `socket.io-client`, added `laravel-echo` and `pusher-js`.

## Environment Configuration
Configured local environment variables to resolve Google Authentication redirects and enable Reverb WebSocket connectivity.

### Backend (`Nexa_BackEnd/.env`)
- Updated `GOOGLE_REDIRECT_URI` to `http://localhost:5001/auth/google/callback`.
- Updated `FRONTEND_URL` and `APP_FRONTEND_URL` to `http://localhost:5000`.
- Updated `APP_URL` to `http://localhost:8000`.
- **WebSocket Fix**: Updated `REVERB_HOST` to `127.0.0.1` to resolve backend connection failures (cURL error 7).
- **Queue Configuration**: Changed `QUEUE_CONNECTION` to `sync` to ensure immediate message delivery without running a queue worker.

### Frontend (`Nexa_FrontEnd/.env`)
- Added Laravel Reverb configuration keys (`VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`).
- Verified `VITE_BACKEND_URL` points to `http://localhost:8000`.
- **WebSocket Fix**: Updated `VITE_REVERB_HOST` to `127.0.0.1` to align with backend configuration.

## Database Configuration (Local Development)
Addressed SQLite compatibility issues in migrations to enable local development setup (`migrate:fresh`).

### Migrations
- Modified multiple migration files to support SQLite limitations (e.g., lack of `ALTER COLUMN`, `DROP FOREIGN KEY` support in raw SQL).
- Wrapped incompatible raw SQL statements in `if (DB::getDriverName() !== 'sqlite')` checks or used Laravel Schema builder alternatives.
- Fixed `duplicate column name` errors in `users` table migrations by adding `Schema::hasColumn` checks.
- Affected files:
  - `2025_07_09_193239_add_creator_social_media_and_industry_fields.php`
  - `2025_07_25_191707_create_transactions_table.php` (Added nullable to creation)
  - `2025_07_27_193753_add_cancelled_status_to_offers_table.php`
  - `2025_09_02_005923_make_sender_id_nullable_for_system_messages_in_messages_table.php`
  - `2025_09_14_074421_clean_default_values_from_users_table.php`
  - `2025_10_31_074617_make_stripe_payment_intent_id_nullable_in_transactions_table.php`
  - `2025_11_12_000000_add_stripe_payment_method_id_to_users_table.php`

### Seeding
- Successfully seeded the database with test data for `SubscriptionPlan`, `WithdrawalMethod`, `Guide`, `Review`, and `Campaign`.

## Server Status
- **Backend**: Running on `http://localhost:8000` (PHP Artisan Serve).
- **Frontend**: Running on `http://localhost:5000` (Vite).
- **WebSocket**: Running on `ws://localhost:8080` (Laravel Reverb).

## Bug Fixes & Improvements (Brand Login & Subscription)
Resolved critical issues preventing brand login and subscription plan checkout in the local environment.

### Backend Fixes
- **Brand Login Error**: Fixed an `Internal Server Error` in `BrandProfileController.php` caused by unnecessary `json_decode` on the `languages` field (already cast to array by model).
- **User Factory**: Updated `UserFactory.php` to initialize `languages` as an array instead of a string, aligning with model casting.
- **Subscription Plans**: Fixed "Subscribe" button inactivity by seeding missing Stripe Product/Price IDs in the `subscription_plans` table using the `stripe:setup-prices` command.
- **CORS Configuration**: Updated `cors.php` to replace wildcard `allowed_origins` with explicit local URLs (`http://localhost:5001`, etc.) to fix WebSocket connection errors ("offline wifi icon").
- **Broadcast Auth Fix**: Updated `BroadcastServiceProvider.php` to register routes with `api` prefix and `auth:sanctum` middleware, resolving 404/401 errors during chat WebSocket authentication.
- **Debug Logging**: Enabled `APP_DEBUG=true` in `.env` to ensure proper error logging.
