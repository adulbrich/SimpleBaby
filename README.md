# Baby Tracker

## Project Overview and Purpose
The Baby Tracker project is a mobile application designed to help parents and caretakers log and monitor various aspects of a baby's daily activities and development. This includes tracking feeding times, sleep patterns, diaper changes, and developmental milestones. The purpose is to provide a convenient and centralized way to keep records, observe trends, and share information with other caregivers or healthcare providers.

## Complete Setup Instructions
To get the Baby Tracker application running locally for development:

**1. Install Dependencies:**
After cloning this repository navigate to the project's root directory in your terminal and run the following command to install the necessary Node.js packages:
```
npm install
```

**2. Test Start the Application:**
Once the dependencies are installed, you can start the development server using Expo CLI:
```
npx expo start
```
This command will allow you to scan a QR code to test run the app on the Expo Go app, available on both Android and iOS.

## Deployment Procedures
Currently, the application is configured for local development and testing via Expo. Deployment to app stores (Apple App Store, Google Play Store) would require additional steps including building standalone app binaries, setting up developer accounts, and following store submission guidelines. These procedures are not yet defined for this project, but you refer to [Expo EAS]([https://expo.dev/eas).

## Maintenance Guidelines
**Regular Updates:**
*   Keep dependencies up-to-date by periodically running `npm update` and testing for compatibility, on a separate branch. You may have packages that lag behind in Expo SDK compatibility so it is best to not update things right away.
*   Update the Expo SDK to the latest version when stable releases are available to leverage new features and bug fixes.

**Codebase Health:**
*   Follow consistent coding standards and comment complex logic.
*   Regularly refactor code to improve readability, maintainability, and performance, using Prettier or similar to autoformat files in the entire codebase is recommended.
*   Address items in the "Known Issues and Future Enhancements" list, marked as `todo.md` in the repo.
*   Ensure that all future PRs pass the current test suite.

**Backend (Supabase):**
*   Monitor Supabase project usage and performance.
*   Ensure regular backups if using a self-hosted Supabase instance (though the provided example setup is local).
*   Keep Supabase Docker images updated if running locally for extended periods.

## Troubleshooting Section
**Common Issues:**
*   **Dependencies Installation Fails:** Ensure you have Node.js and npm installed correctly. Try removing `node_modules` and `package-lock.json` then running `npm install` again.
*   **App Fails to Start on Emulator/Device:**
    *   Ensure your emulator or device is correctly set up and recognized by Expo.
    *   Check the Metro Bundler console for any specific error messages.
    *   At the very worst you have to delete all node related packages and rebuild the app one module at a time if you can't find what breaks (common with Expo), so be careful that you don't corrupt your package.json, following standard version control usage.
*   **Network Request Errors to Supabase:**
    *   Confirm that your local Supabase instance is running.
    *   Verify that the Supabase API URL is correct and accessible from your development machine and/or emulator/device. Ensure the port forwarding is active.
    *   Check the Supabase logs for any errors.

**Specific Issues from "Known Issues" List:**
*   Refer to the "Known Issues and Future Enhancements" section for specific bugs like the "back button fix on android" or "time picker label" issue. These may require targeted debugging.

## Unit Testing
This project uses Jest as the backbone of its testing suite. Tests are created to ensure that all components and logic match the expected behavior, and that future changes to the code do not unknowingly alter the anticipated outputs. All test files and mocks are placed in the `/test` folder. To run the test suite, use the following command:
```
npx jest
```
This will run the regression test suite and inform you of how many tests are passing or failing. Updates to the test suite can be done in `jest.config.js` and `/test/setup.ts`.

## Technical Documentation (Developer-Focused)
This section focuses on the technical aspects relevant to developers working on the project.

**Backend Service: Supabase**
The project utilizes a local Supabase instance for its backend services, including database, authentication, and storage. The Supabase services are port forwarded to a public IP for accessibility. The CLI gives you the default ports and links, in which you can reforward to a public IP or use the official Supabase online (there is a free version).

**Supabase Example Configuration We Used:**
*   **API URL:** `http://76.138.134.66:44321`
*   **GraphQL URL:** `http://76.138.134.66:44321/graphql/v1`
*   **S3 Storage URL:** `http://76.138.134.66:44321/storage/v1/s3`
*   **DB URL:** `postgresql://postgres:postgres@76.138.134.66:44322/postgres`
*   **Studio URL:** Accessible via the Supabase local development environment (typically `http://localhost:54323` by default, but check your local Supabase CLI output or `docker-compose.yml` if customized beyond the provided `http://76.138.134.66:44324` which is Inbucket). The "Studio URL" in the prompt just says "Studio", implying it's the standard local one.
*   **Inbucket URL (Email Testing):** `http://76.138.134.66:44324`
*   **JWT Secret:** `super-secret-jwt-token-with-at-least-32-characters-long`
*   **Anon Key (Public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
*   **Service Role Key (Secret):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`
*   **S3 Access Key:** `625729a08b95bf1b7ff351a663f3a23c`
*   **S3 Secret Key:** `850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907`
*   **S3 Region:** `local`

For more details on local Supabase development, refer to the official Supabase documentation: [Supabase Local Development](https://supabase.com/docs/guides/local-development).

**Frontend Technology Stack:**
*   **Framework:** React Native with Expo
*   **Styling:** NativeWind (TailwindCSS)
*   **Animation:** React Native Reanimated

## User Manual/Documentation
The Baby Tracker app allows users to record and view various activities and milestones for their baby.

**Key Functions:**
*   **Logging Activities:** Users can log events such as feedings (type, amount, duration), sleep periods (start and end times), diaper changes (type), and other custom activities.
*   **Viewing Logs:** A history of logged events can be viewed, typically in a chronological list or potentially summarized.
*   **Tracking Milestones:** (Planned Feature) Users will be able to record developmental milestones, potentially with photos or videos.
*   **Child Management:** (Planned Feature) Users will be able to add, remove, and switch between profiles for multiple children.

**Basic Usage:**
1.  Open the app.
2.  Navigate to the desired tracking section (e.g., "Feedings", "Sleep", "Diapers").
3.  Input the relevant details for the activity.
4.  Save the entry.
5.  View past entries in a "Logs" or "History" section.

## API Documentation
The application interacts with a Supabase backend. The primary API interaction points are:

**1. Supabase REST API:**
   - **Base URL:** `http://76.138.134.66:44321/rest/v1/`
   - **Authentication:** Bearer token (JWT - `anon key` for client-side, `service_role key` for backend/admin tasks).
   - **Usage:** Used for standard database operations (CRUD) on your tables. Requests are typically made to `/rest/v1/your_table_name`.
   - Refer to Supabase documentation for auto-generated API routes based on your database schema.

**2. Supabase GraphQL API:**
   - **Endpoint:** `http://76.138.134.66:44321/graphql/v1`
   - **Authentication:** Same as REST API.
   - **Usage:** Provides a GraphQL interface to query your database.

**3. Supabase Storage API (S3 Compatible):**
   - **Base URL:** `http://76.138.134.66:44321/storage/v1`
   - **S3 Access Key:** `625729a08b95bf1b7ff351a663f3a23c`
   - **S3 Secret Key:** `850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907`
   - **S3 Region:** `local`
   - **Usage:** For uploading, downloading, and managing files like photos and videos for milestones. Buckets need to be created and configured with appropriate policies.
     - Example endpoint for an object: `http://76.138.134.66:44321/storage/v1/object/public/your_bucket_name/path/to/your_file.png`

**4. Supabase Auth API:**
   - **Endpoints:** Various endpoints under `http://76.138.134.66:44321/auth/v1/` (e.g., `/token`, `/signup`, `/magiclink`, etc.)
   - **Usage:** For user registration, login, password recovery, and managing user sessions.

Client-side interactions with these APIs are typically handled via the Supabase JavaScript library (`@supabase/supabase-js`).

## Database Schema and Data Dictionary

**Table: `children`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the child. |
| name | text | Nullable | Name of the child. |
| user_id | uuid | Nullable, Foreign Key to `auth.users.id` | The user associated with this child record. |
| created_at | timestamp | Default: `now()` | Timestamp of when the child record was created. |

**Table: `diaper_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `uuid_generate_v4()` | Unique identifier for the diaper log entry. |
| child_id | uuid | Nullable, Foreign Key to `public.children.id` | The child associated with this diaper log. |
| consistency | text | Nullable | Consistency of the diaper content. |
| amount | text | Nullable | Amount observed in the diaper. |
| change_time | timestamptz | Nullable | The actual time the diaper change occurred. Local timezone applied. |
| logged_at | timestamptz | Default: `timezone('utc'::text, now())` | Timestamp of when the log was entered. Local timezone applied. |
| note | text | Nullable | Additional notes about the diaper change. |

**Table: `feeding_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `uuid_generate_v4()` | Unique identifier for the feeding log entry. |
| category | text | Nullable | Category of feeding (e.g., breast milk, formula, solids). |
| item_name | text | Nullable | Specific name of the food/item. |
| amount | text | Nullable | Amount consumed (e.g., "120ml", "30 minutes", "1 jar"). |
| feeding_time | timestamptz | Nullable | The actual time the feeding occurred. Local timezone applied. |
| child_id | uuid | Nullable, Foreign Key to `public.children.id` | The child associated with this feeding log. |
| logged_at | timestamptz | Default: `timezone('utc'::text, now())` | Timestamp of when the log was entered. Local timezone applied. |
| note | text | Nullable | Additional notes about the feeding. |

**Table: `sleep_logs`**


| Column Name | Data Type | Constraints / Default (Assumed) | Description / Notes (Assumed) |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key | Unique identifier for the sleep log entry. |
| child_id | uuid | Foreign Key (children.id) | The child associated with this sleep log. |
| start_time | timestamp | Not Null | Timestamp for when sleep started. |
| end_time | timestamp | Nullable | Timestamp for when sleep ended. |
| actual_sleep_time | text | Nullable | Calculated or recorded actual duration of sleep. |
| predicted_sleep_time | text | Nullable | Predicted duration of sleep (if applicable). |
| mood_type | text | Nullable | Mood of the child upon waking or before sleep. |
| wake_type | text | Nullable | How the child woke up (e.g., naturally, disturbed). |
| note_audio | text | Nullable | Link or reference to an audio note. |
| note_text | text | Nullable | Textual notes about the sleep. |
| note_file_links | jsonb | Nullable | JSON array of links to other relevant files. |
| logged_at | timestamp | Default: `now()` | Timestamp of when the sleep log was entered or last updated. |

**Table: `nursing_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `uuid_generate_v4()` | Unique identifier for the nursing log entry. |
| child_id | uuid | Nullable, Foreign Key to `public.children.id` | The child associated with this nursing log. |
| left_duration | text | Nullable | Duration of nursing on the left side. |
| right_duration | text | Nullable | Duration of nursing on the right side. |
| logged_at | timestamptz | Default: `timezone('utc'::text, now())` | Timestamp of when the log was entered. Local timezone applied. |
| note | text | Nullable (Optional Field) | Additional notes about the nursing session. |
| left_amount | text | Nullable (Optional Field) | Amount consumed from the left side (if measured). |
| right_amount | text | Nullable (Optional Field) | Amount consumed from the right side (if measured). |

**Table: `health_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `uuid_generate_v4()` | Unique identifier for the health log entry. |
| category | text | Nullable | Category of the health event (e.g., "Growth", "Activity", "Medication"). |
| date | timestamptz | Nullable | Date and time of the health event. Local timezone applied. |
| child_id | uuid | Nullable, Foreign Key to `public.children.id` (Optional Field) | The child associated with this health log. |
| growth_length | text | Nullable (Optional Field) | Child's length measurement. |
| growth_weight | text | Nullable (Optional Field) | Child's weight measurement. |
| growth_head | text | Nullable (Optional Field) | Child's head circumference measurement. |
| activity_type | text | Nullable (Optional Field) | Type of activity logged (e.g., "Tummy Time", "Walk"). |
| activity_duration | text | Nullable (Optional Field) | Duration of the activity. |
| meds_name | text | Nullable (Optional Field) | Name of the medication administered. |
| meds_amount | text | Nullable (Optional Field) | Amount of medication administered. |
| meds_time_taken | timestamptz | Nullable (Optional Field) | Actual time medication was taken. Local timezone applied. |
| note | text | Nullable (Optional Field) | Additional notes about the health event. |
| logged_at | timestamptz | Default: `timezone('utc'::text, now())` (Optional Field) | Timestamp of when the log was entered. Local timezone applied. |

## Basic Architecture


![Simple Baby Deployment Diagram](/Deployment-Diagram.png)

**Flow:**
1.  The Expo app on the user's device makes API calls (REST, GraphQL, Auth, Storage) to the Supabase instance.
2.  Supabase services (PostgREST for REST API, etc.) handle these requests.
3.  Data is stored in and retrieved from the PostgreSQL database.
4.  Files (e.g., for milestones) are handled by the S3-compatible Storage service.
5.  Realtime updates (when implemented) would use Supabase Realtime.
6.  Inbucket captures emails sent by Supabase Auth for testing (like confirmation emails, password resets).


## Known Issues and Future Enhancements List
The following are missing features or known issues, both big and small, that would improve the experience of using the app:

*   [ ] Guest mode (local only)
    *   Dependencies: [local db]
*   [ ] Back button fix on android
*   [ ] Add custom popup alerts framework
*   [ ] Add child management screens (add, remove, switch)
*   [ ] Add caretaker account option (and caretaker permission manager)
*   [ ] Add change password, change email, forgot password
*   [ ] Fix time picker label in sleep tracker displaying incorrect label in android
*   [ ] Improve implementation of reset field in sleep tracker (requires modularization of all components)
*   [ ] Log editing feature
    *   Dependencies: [db syncing, local db]
*   [ ] Add milestones (s3 buckets for video and photo storage)
*   [ ] Make choose time drop down smoother
*   [ ] Add splash screen
*   [ ] Add logo
*   [ ] Add sound effects
*   [ ] Add sound effect settings
    *   Dependencies: [sound effects]
*   [ ] Make stopwatch remember time in local storage after app exit
*   [ ] Fix first time animation jump glitch with nativewind/react native reanimated
*   [ ] Autoscroll provider to make sure we don't have to reimplement scrolling if UI takes too much space on every screen
*   [ ] Implement calendar feature
*   [ ] Add number of logs and activity graph to logs tab screen
*   [ ] Implement log screen more than the basic bare bones implementation

```
