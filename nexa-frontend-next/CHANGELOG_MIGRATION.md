# Nexa v2 Migration Changelog - Step 2

## New Features
- **Creator Profile System**:
  - Full profile view with avatar, social media links, and personal details.
  - **Edit Profile**: Comprehensive form to update personal info, niche, languages, and profile picture.
  - **Social Media Integration**: Fields for Instagram, TikTok, YouTube, Twitter, etc.
- **Brand Campaign Management**:
  - **Create Campaign**: Multi-step form adapted to Next.js for brands to post new campaigns.
  - **Validation**: Strict validation for budget, deadline, and requirements.
  - **File Upload**: Integrated logo and attachment upload logic.
- **Contracts System**:
  - **Contract Entity**: Defined core contract structure.
  - **Contract Repository**: Added API integration for fetching contracts.
  - **Contract List**: Dashboard component to view active, pending, and completed contracts.
  - **Contract Card**: Visual representation of individual contracts with status badges.
- **Dashboard Enhancements**:
  - Added "New Campaign" button for brands.
  - Integrated `ContractList` into both Creator and Brand dashboards.
  - Added `ProfilePage` logic handling both user types.

## Technical Improvements
- **Type Safety**: Enhanced `User` entity with detailed profile fields.
- **Architecture**: Created `CreateCampaignUseCase` and `UpdateProfileUseCase` following Clean Architecture.
- **UI Components**: Added `DatePicker` (using `date-fns` and `react-day-picker`), `Popover`, and improved `Select` components.
- **Linting**: Fixed lint errors in `EditProfile` and `BrandDashboard`.

## Next Steps
- Implement "My Applications" view for creators.
- Implement "View Applications" for brands to select creators.
- Add "Payment" integration (Stripe/Pagar.me placeholders).
