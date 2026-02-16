# Contributing to SimpleBaby
This file contains instructions on how to contribute to this project.

## Prerequisites & Local Setup
### Development Setup
To begin locally developing for this project, clone this repository into your desired local directory.

```git clone https://github.com/adulbrich/SimpleBaby```

After this, if you have not already, install Node.js onto your machine. This will allow you to use npm, which is necessary to manage dependencies for this project. Instructions for this can be found here:
- [Node.js](https://nodejs.org/en/download)

Then, assuming you have Node.js and npm installed, run the following command in your project directory to install all dependencies for the app:

```npm install```

Using npx, you can then start the development server for the application with the Expo CLI, allowing you to then begin running an emulator of your choice:

```npx expo start```

### Running on a Simulator / Emulator
To run on a local simulator/emulator, ensure you have your desired Android emulator or iOS simulator downloaded and set up to locally run and test the app. You will need Xcode to set up an iOS simulator, or Android Studio to set up an Android emulator.
- [Xcode](https://developer.apple.com/xcode/) (only available on macOS)
- [Android Studio](https://developer.android.com/studio) (available on Windows, macOS, and Linux)

Once you have your emulator(s) set up and the project is running, you are then set to run the app on your machine. If you wish to test on Android, press `a` to run the device on your Android emulator. Note that Android Studio must already be open and your emulator must be running. Otherwise, press `i` to run the device on your iOS simulator.

### Running on a Physical Device
If you wish to run the application on a physical device, you must first download the Expo Go app before continuing. Once you have the application downloaded on your smartphone, scan the QR code printed to the terminal by the Expo CLI, and you can then run the app on a physical device. Download links for the Expo Go mobile app can be found here:
- [Expo Go](https://expo.dev/go)

### Database Setup
To properly sign up or sign into the app, you will need to have a Supabase database set up. You can sign up and create a project (i.e., your own database) with this link:
- [Supabase](https://supabase.com)

Once you have signed up and confirmed your email, create your organization and project. You can easily get by developing for this project using a Free plan.

Then, you will want to get your environment variables from the Supabase dashboard to interact with your database. Click the "Connect" button at the top of the dashboard, then click 'Mobile Frameworks.' By default, the framework should show 'Expo React Native' using 'Supabase-js.' If your dashboard does not show this, click on the 'Framework' and 'Using' dropdowns to update them.

You should then see some text that looks like this on the project connection page.
```
EXPO_PUBLIC_SUPABASE_URL=https://dontcopyme-thisisanexample.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_do_not_copy_this_is_just_an_example
```

Copy the environment variables that you are given from the Supabase dashboard, create a `.env` file in the root of your project folder, and paste them into that file.

After your organization and project have been set up, you will want to use the Supabase command line interface to continue to get set up. This is necessary in order to apply the migration files to your project database, and to make future changes to the app's database setup (e.g., adding new log types, adding categories for a log type, etc). You can easily use the Supabase CLI with npx, but if you'd prefer to directly install the CLI, check out the instructions below from the Supabase documentation. This guide will assume you are using npx to work with the Supabase CLI.
- [Supabase - Local Dev / CLI](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=npm)

You will then need to install Docker Desktop, which is a prerequisite to manage the local development stack. Generally, you will only need Docker Desktop running when doing first time setup and linking of the database (assuming you are not manually copy-pasting migration files into Supabase's SQL editor) or when you are attempting to make updates to the database (e.g., updating table schemas). You can find the download link for Docker Desktop here:
- [Docker Desktop](https://docs.docker.com/desktop)

Run the following command to connect your Supabase CLI to your Supabase account. Follow the on-screen prompts to continue logging in and linking your local/remote setups.

```npx supabase login```

After this, in order to get the remote Supabase database set up, you will want to link your CLI with your project. In Supabase, go to your Project Settings, which can be accessed via the left sidebar, and copy your Project ID. Then, run the command below, replacing the bracketed code with your Project ID.

```npx supabase link --project-ref <your-project-id>```

Then, run the following command to push this project's database migrations to your remote Supabase project:

```npx supabase db push```

Lastly, you will want to add a bucket to your database in order to store files in the app (e.g., for milestone logs). In the Supabase dashboard, go to the left sidebar menu and click on Storage. From there, press Files and select the Buckets tab. Press the "New bucket" button, and create a bucket titled `milestone-logs`. Leave the three options (public bucket, restrict file size, and restrict MIME) all unchecked. Then, create the bucket.

Now, you are officially all set to run the application, work with your database, and develop changes for the project! If you run into any trouble with setting up your database, refer to to the official Supabase documentation for assistance:
- [Supabase Docs](https://supabase.com/docs)

## Linting and Testing
This project uses a continuous integration workflow to ensure that incoming pull requests meet consistent standards of quality. Part of this process is ensuring that updates to the code pass a linter and pass our unit test suite.

To check that your updated code passes the linter, run the following command:

```npx expo lint```

Then, run the following command to run the regression test suite using Jest:

```npx jest```

If no lint errors are shown and all tests pass, your code has passed the necessary quality checks for this project!

## Contribution Workflow
### Definition of Done (DoD)
Before pushing your changes to this repository, we kindly request that you ensure your code passes our quality checks. You can do so with the steps listed in the prior section; otherwise, this repository's workflow will run the linter and test suite at the time your changes are pushed remotely.
We typically consider your changes to be "done" if the answer is "Yes" to each of the following questions:
- Does my code follow the style guidelines of this project?
- Do my changes generate no new warnings or errors?
- Has the documentation been updated (if needed)?
- Have I added new comments when necessary?
- Do new and existing unit tests pass locally with my changes?
- Does my code pass the linter locally with my changes?
- Have I pulled and merged main into my branch before committing my changes?

### Pull Request Naming
When making a pull request, we ask that you use this naming convention when pushing to the repository:
> <PREFIX_TYPE_OF_CHANGE>:<UPDATE_INFO>

Some examples of pull request names in this format include the following:
- BUG: Fix Date/Time Dropdown
- FEATURE: Add Milestone Log Tracker
- MISC: Update README File

*NOTE:* The primary SimpleBaby development team uses Jira to manage work items for this project. Therefore, you may see some pull request with formatting like this, but we ask that you do not name pull requests with this prefix unless you're an active member of this project management board:
> KAN-123: Sample Pull Request

## Reporting Bugs & Requesting Changes
To report bugs and request future changes to the project, please open a new issue in the repository. This will allow the team to take note of the bug and/or add the requested feature/fix to their project management board via Jira. The link to the issues page can be found here:
- [Issues](https://github.com/adulbrich/SimpleBaby/issues)

When reporting bugs, please include the following information:
- Expected behavior versus actual behavior
- How to replicate the bug
- A screenshot of the defect (if applicable)
- Environment details (e.g., iOS or Android)

When requesting potential features, including as much detail as possible is beneficial for the development team to understand your intention of said feature. The following information can be helpful:
- What the feature is
- How the new feature should function
- A visual mockup (e.g., a picture of drawing mockup, Figma screenshots, etc.)
- Possible methods of how to implement the feature

## Where To Ask For Help
The development team for this project is consistently switching and evolving. As such, please contact the project leader for further inquiries and assistance requests. You may find his contact information at the links below:
- [Alexander Ulbrich on LinkedIn](https://www.linkedin.com/in/adulbrich/)
- [adulbrich on GitHub](https://github.com/adulbrich)