# SimpleBaby

## Project Overview and Purpose
SimpleBaby is a mobile application designed to help parents and caretakers log and monitor various aspects of a baby's daily activities and development. This includes tracking feeding times, sleep patterns, diaper changes, nursing logs, and health and developmental milestones. The purpose of the project is to provide a convenient and centralized way to keep records, observe trends, and monitor all aspects of a newborn child's development, all within a private and securely encrypted environment.

## Complete Setup Instructions
To get the SimpleBaby running locally for development:

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
Currently, the application is configured for local development and testing via Expo. Deployment to app stores (Apple App Store, Google Play Store) would require additional steps including building standalone app binaries, setting up developer accounts, and following store submission guidelines. These procedures are not yet defined for this project, but you should refer to [Expo EAS]([https://expo.dev/eas) for now.

## Maintenance Guidelines
**Regular Updates:**
*   Keep dependencies up-to-date by periodically running `npm update` and testing for compatibility issues. You may have packages that lag behind in Expo SDK compatibility, so it is best to not update things right away.
*   Update the Expo SDK to the latest version when stable releases are available to leverage new features and bug fixes.

**Codebase Health:**
*   Follow consistent coding standards and be sure to write comments for complex functions and types.
*   We recommend that you egularly refactor code to improve readability, maintainability, and performance, using Prettier or similar to autoformat files in the entire codebase.
*   Address items in the "Known Issues and Future Enhancements" list, at the bottom of this file.
*   Ensure that all future PRs pass the current test suite and linter.

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

## Unit Testing
This project uses Jest as the backbone of its testing suite. Tests are created to ensure that all components and logic match the expected behavior, and that future changes to the code do not unknowingly alter the anticipated outputs. All test files and mocks are placed in the `/test` folder. To run the test suite, use the following command:
```
npx jest
```
This will run the regression test suite and inform you of how many tests are passing or failing. Updates to the test suite can be done in the `/test` folder. All pull requests to the repository must pass these tests before they can be merged into the `main` branch.

## Technical Documentation (Developer-Focused)
This section focuses on the technical aspects relevant to developers working on the project.

**Backend Service: Supabase**
The project utilizes Supabase for its backend services, including database handling, user authentication, and data storage. If developing locally (i.e., without a deployed database), the Supabase services can be port forwarded to a public IP for accessibility. The CLI gives you the default ports and links, in which you can reforward to a public IP or use the official Supabase online (there is a free version).

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
SimpleBaby allows users to record and view various activities and milestones for their baby.

**Key Functions:**
*   **Logging Activities:** Users can log events such as feedings (type, amount, duration), sleep periods (start and end times), diaper changes (type), developmental milestones (including photo uploads), nursing activity, and health milestones.
*   **Viewing Logs:** A history of logged events can be viewed in a chronological list.
*   **Calendar:** Users can view a monthly calendar that details logs they have created for each day.
*   **Child Management:** Users can add, remove, and switch between profiles to log info for multiple children.
*   **Guest Mode:** Users can log into the app in Guest Mode, allowing them to log data in a secure local database without having to sign up for an account.

**Basic Usage:**
1.  Open the app.
2.  Navigate to the desired tracking section (e.g., "Feedings", "Sleep", "Diapers").
3.  Input the relevant details for the activity.
4.  Save the entry.
5.  View past entries in a "Logs" or "Calendar" section.

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
| user_id | uuid | Not Null, Foreign Key to `auth.users.id` (CASCADE) | The user (parent/guardian) this child belongs to. |
| name | text | Not Null | Name of the child. |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |

**Table: `diaper_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the diaper log entry. |
| child_id | uuid | Not Null, Foreign Key to `children.id` (CASCADE) | The child this diaper log belongs to. |
| consistency | text | Not Null | The consistency of the diaper contents (e.g. wet, soft, solid). |
| amount | text | Not Null | The amount observed in the diaper. |
| note | text | Nullable | Optional free-text note about the diaper change. |
| change_time | timestamptz | Not Null | The date/time the diaper change occurred. |
| logged_at | timestamptz | Not Null, Default: `now()` | The date/time the entry was logged. |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |

**Table: `feeding_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the feeding log entry. |
| child_id | uuid | Not Null, Foreign Key to `children.id` (CASCADE) | The child this feeding log belongs to. |
| category | text | Not Null | The category of the feeding (e.g. breast milk, formula, solid food). |
| item_name | text | Not Null | The name of the food or drink consumed. |
| amount | text | Not Null | The amount consumed. |
| feeding_time | timestamptz | Not Null | The date/time the feeding occurred. |
| note | text | Nullable | Optional free-text note about the feeding session. |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |
| updated_at | timestamptz | Not Null, Default: `now()`, Auto-updated by trigger | Timestamp of the last update; managed by the `feeding_logs_set_timestamp` trigger. |

**Table: `sleep_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the sleep log entry. |
| child_id | uuid | Not Null, Foreign Key to `children.id` (CASCADE) | The child this sleep log belongs to. |
| start_time | timestamptz | Not Null | The date/time the sleep session started. |
| end_time | timestamptz | Not Null | The date/time the sleep session ended. Must be after `start_time`. |
| duration | text | Not Null | The duration of the sleep session. |
| note | text | Nullable | Optional free-text note about the sleep session. |
| logged_at | timestamptz | Not Null, Default: `now()` | The date/time the sleep session was logged. |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |
| updated_at | timestamptz | Not Null, Default: `now()`, Auto-updated by trigger | Timestamp of the last update; managed by the `sleep_logs_set_timestamp` trigger. |

**Table: `nursing_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the nursing log entry. |
| child_id | uuid | Not Null, Foreign Key to `children.id` (CASCADE) | The child this nursing log belongs to. |
| left_duration | text | Nullable | Duration of feeding on the left side. |
| right_duration | text | Nullable | Duration of feeding on the right side. |
| left_amount | text | Nullable | Amount expressed/consumed on the left side. |
| right_amount | text | Nullable | Amount expressed/consumed on the right side. |
| note | text | Nullable | Optional free-text note about the nursing session. |
| logged_at | timestamptz | Not Null, Default: `now()` | The date/time the nursing session occurred. |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |
| updated_at | timestamptz | Not Null, Default: `now()`, Auto-updated by trigger | Timestamp of the last update; managed by the `nursing_logs_set_timestamp` trigger. |

**Table: `health_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the health log entry. |
| child_id | uuid | Not Null, Foreign Key to `children.id` (CASCADE) | The child this health log belongs to. |
| category | health_category | Not Null | The category of the health log. Enum: `Growth`, `Activity`, `Meds`, `Vaccine`, `Other`. |
| date | timestamptz | Not Null | The date/time the health event occurred. |
| growth_length | text | Nullable | Recorded length/height. Required when `category = 'Growth'` (alongside at least one other growth field). |
| growth_weight | text | Nullable | Recorded weight. Required when `category = 'Growth'` (alongside at least one other growth field). |
| growth_head | text | Nullable | Recorded head circumference. Required when `category = 'Growth'` (alongside at least one other growth field). |
| activity_type | text | Nullable | Type of activity. Required when `category = 'Activity'`. |
| activity_duration | text | Nullable | Duration of activity. Required when `category = 'Activity'`. |
| meds_name | text | Nullable | Name of the medication. Required when `category = 'Meds'`. |
| meds_amount | text | Nullable | Dosage/amount of the medication. Required when `category = 'Meds'`. |
| meds_time_taken | timestamptz | Nullable | Time the medication was taken. Required when `category = 'Meds'`. |
| vaccine_name | text | Nullable | Name of the vaccine. Required when `category = 'Vaccine'`. |
| vaccine_location | text | Nullable | Injection site or location of the vaccine. Optional even when `category = 'Vaccine'`. |
| other_name | text | Nullable | Name/title of the other health event. Required when `category = 'Other'`. |
| other_description | text | Nullable | Additional details for the other health event. Optional even when `category = 'Other'`. |
| note | text | Nullable | Free-text note applicable to any category. |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |
| updated_at | timestamptz | Not Null, Default: `now()`, Auto-updated by trigger | Timestamp of the last update; managed by the `health_logs_set_timestamp` trigger. |

**Table: `milestone_logs`**


| Column Name | Data Type | Constraints / Default | Description / Notes |
| :-- | :-- | :-- | :-- |
| id | uuid | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the milestone log entry. |
| child_id | uuid | Not Null, Foreign Key to `children.id` (CASCADE) | The child this milestone belongs to. |
| title | text | Not Null | Title or name of the milestone. |
| category | milestone_category | Nullable, Default: `'Other'` | The category of the milestone. Enum: `milestone_category`. |
| note | text | Nullable | Optional free-text note about the milestone. |
| achieved_at | timestamptz | Not Null | The date/time the milestone was achieved. |
| photo_url | text | Nullable | URL to a photo associated with the milestone. |
| source | text | Nullable | Source or reference for the milestone (e.g. doctor, book, app). |
| created_at | timestamptz | Not Null, Default: `now()` | Timestamp of when the record was created. |
| updated_at | timestamptz | Not Null, Default: `now()`, Auto-updated by trigger | Timestamp of the last update; managed by the `milestone_logs_set_timestamp` trigger. |

## Basic Architecture


![Simple Baby Deployment Diagram](/SimpleBaby-UML-Diagram.png)

**Flow:**
1.  The Expo app on the user's device makes API calls (REST, GraphQL, Auth, Storage) to the Supabase instance.
2.  Supabase services (PostgREST for REST API, etc.) handle these requests.
3.  Data is stored in and retrieved from the PostgreSQL database.
4.  Files (e.g., for milestones) are handled by the S3-compatible Storage service.
5.  Realtime updates (when implemented) would use Supabase Realtime.
6.  Inbucket captures emails sent by Supabase Auth for testing (like confirmation emails, password resets) when implemented.


## Known Issues and Future Enhancements List
The following are missing features or known issues, both big and small, that would improve the experience of using the app:

*   [ ] Add custom popup alerts framework
*   [ ] Add caretaker account option (and caretaker permission manager)
*   [ ] Add account management features (i.e., change password, change email, forgot password)
*   [ ] Add splash screen
*   [ ] Add logo(s)
*   [ ] Make stopwatch remember time in local storage after app exit
*   [ ] Add number of logs and activity graph to logs tab screen / calendar screen
*   [ ] Fix the iOS-exclusive child management bug (see open issue in the repo)
*   [ ] Buttons push multiple requests to the database or navigation stack when loading (see open issues)
*   [ ] Non-descriptive error messages
*   [ ] Use of `isTyping` state and `translate-y` tailwind class causing scrolling issues when creating logs
*   [ ] Add loading indicators for async button presses

-------
#### © Alex Ulbrich - 2024-2026
(Developed by Bryant Shitabata, Jacob Cocheu, James Grant, Michael Nunzio, Nathan Johnston, Sonny Box, Srija Palla, and Yahir Gonzalez)