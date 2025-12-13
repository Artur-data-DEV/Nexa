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
- Updated `GOOGLE_REDIRECT_URI` to `http://localhost:8000/auth/google/callback`.
- Updated `FRONTEND_URL` and `APP_FRONTEND_URL` to `http://localhost:5001`.
- Updated `APP_URL` to `http://localhost:8000`.

### Frontend (`Nexa_FrontEnd/.env`)
- Added Laravel Reverb configuration keys (`VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`).
- Verified `VITE_BACKEND_URL` points to `http://localhost:8000`.
