# TaskMate

> **Divide the work. Work together.**

TaskMate is a lightweight, client-side group task distribution and planning web app built for students and small teams. It helps a group choose a project type, generate sensible responsibilities, create an initial task distribution, customize assignments, and save the result locally.

## Features

- Predefined project types: Reporting, Research, Capstone Project, Software Development, Presentation, Group Assignment, Case Study, and Event / Organization Task
- Custom project type support
- Optional project title and optional member names
- Automatic generic names such as `Member 1`, `Member 2`, etc.
- Recommended task templates based on project type
- Balanced initial task assignment
- Many-to-many assignment model:
  - one member can have multiple tasks
  - one task can have multiple members
- Add, edit, duplicate, and delete tasks
- Check/uncheck members directly on task cards
- By Task and By Member views
- Workload summary per member
- Shuffle distribution without changing tasks or members
- LocalStorage-based saved projects
- Open, duplicate, and delete saved projects
- Copy assignment plan to clipboard
- Print-friendly project view
- Responsive desktop, tablet, and mobile layout
- Keyboard focus styles, semantic labels, ARIA live feedback, and accessible dialogs

## How It Works

1. Click **Create a Project**.
2. Choose the project type.
3. Enter an optional project title/topic.
4. Choose the number of group members.
5. Optionally enter member names.
6. TaskMate generates a task list and an initial distribution.
7. Customize tasks and member assignments.
8. Review workload by member.
9. Save, copy, shuffle, or print the final plan.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- DOM manipulation
- LocalStorage
- Clipboard API with a fallback copy method
- Browser print styles

No backend, authentication, external database, or build step is required.

## Run the Project

### Option 1 — Open directly

Open `index.html` in a modern browser.

### Option 2 — Use a local server

From the TaskMate folder, run any simple static server. Examples:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

If you use VS Code, the **Live Server** extension also works well.

## Project Structure

```text
TaskMate/
├── index.html
├── style.css
├── script.js
└── README.md
```


**TaskMate makes group work easier by helping everyone know what they need to do.**
