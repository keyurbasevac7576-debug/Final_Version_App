# Production Tracking Portal - Setup Instructions

This is a complete rebuild of the production tracking portal using Supabase as the database backend.

## Database Setup

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard at: https://ohminprmzhizoxgjasrl.supabase.co
2. Navigate to the **SQL Editor** (in the left sidebar)
3. Create a new query
4. Copy and paste the contents of `supabase-migration.sql` into the editor
5. Click **Run** to execute the migration
6. Verify that all tables were created successfully by checking the **Table Editor**

### Step 2: Verify Environment Variables

The `.env` file already contains the correct Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your public anonymous key

## Application Structure

### Database Schema

The application uses the following tables:

1. **categories** - Top-level production categories
2. **sub_categories** - Sub-categories with tracking method (units or milestones)
3. **weekly_targets** - Weekly production targets for each sub-category
4. **tasks** - Individual tasks that team members can complete
5. **team_members** - All team members who submit production reports
6. **daily_entries** - Daily production records

### Key Features

1. **Production Report Form** - Submit daily production entries
   - Select team member, category, sub-category, and task
   - Enter time spent (hours and minutes)
   - Track either units completed or milestone progress
   - Add notes for each entry

2. **Weekly Targets** - View current week's production targets

3. **Recent Entries** - See all entries from the current week

4. **Admin Portal** - Manage all master data
   - Categories and Sub-Categories
   - Tasks with standard times and milestones
   - Team Members
   - Weekly Targets
   - Analytics Dashboard with charts

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: SWR for real-time updates
- **Charts**: Recharts for analytics

## Running the Application

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Initial Data Setup

After running the migration, you'll need to add some initial data through the admin portal:

1. Navigate to `/admin`
2. Add Categories (e.g., "Fabrication", "Assembly", "QA Testing")
3. Add Sub-Categories for each category with tracking method
4. Add Team Members
5. Add Tasks for each sub-category
6. Set Weekly Targets (optional but recommended)

## Notes

- All tables have Row Level Security (RLS) enabled
- Public read access is allowed (suitable for internal tools)
- Authenticated users can insert/update/delete records
- The application is designed for internal use within your organization
