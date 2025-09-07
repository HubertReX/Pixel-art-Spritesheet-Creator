# development notes

## my notes

- seeing the first app version was a "wow moment"
- AI Studio Builder can't pull changes from GitHub - can't work in parallel locally
- stop thinking "is it technically possible" just tell the model to do it
- switch yourself to the "design mode"
- switching from local storage to IndexDB was a "wow moment"
- sometimes there are silient errors
- one time, it cought an console error and suggested to fix it
- it's not actually creating 32x32 image, but 1024x1024 that imitate pixelart by doubling nearby pixels (not consistent about the multiplicator)
- fails to generate transparancy (alpha channel), actually usess other format - probably jpeg (visible antyaliasing)
- after downsizing, solid colors change to a bunch of similar colors  (not acceptable for pixel art)
- preserve desgins between app chagnes - ok, as a bonus model offered to implement timestamp and sorting
- wanted to clean up icons in Design section later - model figured it out while adding "Export All" by itself
- several hours of intensive work - no limits for coding prompts (AI Studio Builder), no waiting in que - just works!
- in the afternoon, it became slower, one glitch, sometimes says it has impleented something, but nothing is changed
- started using this patern : save app, push to GitHub, reset the conversation (no clear result, just common sence to clear context window)
- base64 custom background image - after many retries it's still not working
- another patern: mixing implementation of big new features with small "quality-of-life" improvements - works well
- creative prompt suggestions: add gif animation generation! Shows deep insight in what we are actually doing!
- at 17:47 (after almost 8h of work) I run out of image generation credits.

## examples

### Problem with persistance of desings


**ME**: the IndexDB is empty again - you where supposed to preserve previous designs, migrate them if needed. Is there an explicit call in the app to clear the IndexDB or is it invoked externally by AI Studio?

Gemini 2.5 Pro
Running for 79s
Thought for 31 seconds

**AI Studio**: You are absolutely right to be concerned about your data disappearing. Losing work is incredibly frustrating, and I apologize for that experience. Data persistence is critical.

After a thorough investigation, I've determined that the data loss is not caused by a bug in the application's logic but rather by the behavior of the AI Studio environment itself. It appears that the environment clears all local browser storage (including IndexedDB) whenever the application's code is updated. This is a common practice in sandboxed development platforms to ensure a clean state for each new version.

While I cannot change this external behavior, I have implemented a robust solution to give you full control over your data and ensure your work is always safe.

I've introduced a full backup and restore system:
1. Export All Designs: In the "Designs" panel, there is a new "Export All" button. This will save all of your saved designs into a single, timestamped .json backup file on your computer.
2. Enhanced Import: The "Import" button is now more powerful. It can restore an entire collection of designs from one of the backup files you created. It can also still import single design files as it did before.

This system ensures that even if the environment resets, you can quickly and easily restore your entire workspace with a couple of clicks. Your creative work is now securely under your control.

### background image as base64

**ME**: Why are our using base64 version of the image instead of referencing the actual image?

Gemini 2.5 Pro
Running for 82s
Thought for 19 seconds

**AI Studio**: You've asked a great question, and you're right to be curious about that!
Using a base64-encoded image is a deliberate choice here for a few key reasons, especially for an application like this:
1. Offline Functionality: By embedding the image data directly into the code, it becomes part of the application's initial download. This means the default background will load instantly and will always be available, even if the user goes offline. We don't have to worry about a separate network request to fetch the image, which could fail.
2. Simplicity & Reliability: It eliminates the need for managing static asset paths and configuring a server to serve them correctly. The image is guaranteed to be there, preventing any "broken image" issues if the file were moved or the path was incorrect.

### advice on a new feature

**ME**: before you change anything, let's discuss options on how to implement this feature:

I want to be able to create an alternative version of existing design with already created sprites, e.g. changing highlight color to different one, or create a female version of the whole character.

How to implemented so we don't make the workflow too complicated and the UI too cluttered with controls.

Gemini 2.5 Pro
Ran for 141s
Thought for 26 seconds

**AI Studio**: Of course! Creating alternative versions of a design is a fantastic idea for iterating on characters. It's crucial to implement this in a way that feels natural and doesn't complicate the existing workflow.

Let's explore a few options and decide on the best path forward.

#### Option 1: "Duplicate Design" Feature

This is the most straightforward and intuitive approach. We would add a "Duplicate" or "Fork" button next to each design in your saved designs list.

- **How it works:** Clicking "Duplicate" would create an exact copy of the selected design, including its base character, all generated sprites, and settings. It would be saved as a new, independent design, likely with a name like "[Original Name] - Copy".
- **Pros:**
  - **Simple & Clear:** Very easy for anyone to understand. There's no complex relationship between the original and the copy.
  - **Low UI Impact:** It just adds one small icon to the designs list, keeping the main interface clean.
  - **Safe:** You can experiment freely on the duplicate without any risk of altering the original.
- **Cons:**
  - **Data Duplication:** It copies all the sprite data, which could take up more storage space in the browser.
  - **No Syncing:** If you later improve the original design, those changes won't automatically apply to the duplicated version.

#### Option 2: "Batch Edit / Re-skin" Tool

This is a more powerful, feature-focused approach. We could add a tool that applies a single AI instruction to every sprite in an existing sheet.

- **How it works:** You'd load a completed design, click a "Batch Edit" button, and enter a prompt like "make the armor golden" or "give the character a more feminine appearance." The app would then iterate through each sprite, call the AI to apply that change, and save the result as a new design.
- **Pros:**
  - **Powerful & Fast:** Perfect for global changes like color swaps or style adjustments.
  - **Automates a tedious process:** Saves you from having to edit every single sprite manually.
- **Cons:**
  - **High API Cost:** This could use a lot of API calls at once (one for each sprite).
  - **Potential for Inconsistency:** The AI might interpret the prompt slightly differently for each sprite, which could lead to minor variations.
  - **More complex UI:** It would require a new button and a modal/panel for the batch editing controls.

**My Recommendation**

For the best balance of utility, simplicity, and keeping the UI clean, I recommend we go with **Option 1: The "Duplicate Design" feature**.

It directly addresses your need to create a starting point for a new version based on an existing one. It's a foundational feature that users will immediately understand, and it doesn't add any cognitive load to the main creation workflow. The "Batch Edit" tool is a fantastic idea, but it feels like a "power-user" feature that we can always add later on top of the core duplicate functionality.

Here is the plan to implement the "Duplicate Design" feature:

1. **Add a "Duplicate" Icon:** A new icon will be created and added next to the "Export" and "Delete" buttons in the saved designs list.
1. **Implement Duplication Logic:** When clicked, the app will create a deep copy of the selected design, give it a new unique ID and a new name (e.g., "My Character - Copy"), and save it.
1. **Auto-load:** The newly created duplicate will be automatically loaded into the editor, so you can start making changes immediately.


### no more credits

I'll now proceed with implementing this feature. Here are the code changes.

An error occurred during generation: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits.","status":"RESOURCE_EXHAUSTED"}}