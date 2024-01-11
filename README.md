# Schoolday Planner

> [!Caution]
>  Tauri v2 is approaching stability fast, but it not yet considered ready for production use.

```sh
git clone --depth 1 https://github.com/S3bTheGuy/schoolday-planner.git
```

## Running 🚤

The snippets below use [PNPM](https://pnpm.io) as the package manager and task runner, but Yarn, NPM, Bun, or Cargo should also work with the appropriate syntax.

First step is always to install JS dependencies from the root:

```sh
pnpm install
```

## Desktop (MacOS, Linux, or Windows) 🖥️

Once the template is properly cloned, install Node.js dependencies and you can run the Tauri app.

```sh
pnpm tauri dev
```

## iOS 🍎

<img src="/docs/ios.png" align="right" height="300"/>

[Check the prerequisites](https://beta.tauri.app/guides/prerequisites/#ios) for having iOS ready to run (MacOS only).
Once that is done, let’s create the XCode project:

```sh
pnpm tauri ios init
```

If everything runs successfully (keep an eye for warnings on your terminal).
You can start the development server:

```sh
pnpm tauri ios dev --open
```

This command will open XCode with your project, select the simulator and get ready to run.

## Android 🤖

<img src="/docs/android.png" align="right" height="300"/>

[Android Studio and a few other steps will be required](https://beta.tauri.app/guides/prerequisites/#android) to get things up and running.
Once that's done, you can initialize the project:

```sh
pnpm tauri android init
```

Open the Android Studio, and run the development build:

```sh
pnpm tauri android dev
```

This command will open the Android Pixel simulator.

---

<img width="50" src="/public/tauri.svg" />
