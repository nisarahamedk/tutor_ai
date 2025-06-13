```markdown
# ITS-Specific AG-UI Interaction Contracts

This document details how the Intelligent Tutoring System (ITS) utilizes the Agent User Interaction (AG-UI) Protocol. It defines the structure of data exchanged for specific ITS features, leveraging standard AG-UI events and input mechanisms.

## 1. Frontend (FE) to Backend (BE) Communication

All FE to BE communication uses the standard AG-UI `POST /awp` endpoint with a `RunAgentInput` request body.

### 1.1. `RunAgentInput` for ITS

#### 1.1.1. `messages: Message[]`
- **User's Typed Text:**
  - Standard `Message` object with `role: "user"` and `content` containing the text.
  - Example:
    ```json
    [{ "id": "msg-user-text-001", "role": "user", "content": "What is the capital of France?" }]
    ```
- **User's Interaction with an ITS Rich Component (Tool Response):**
  - Standard `Message` object with `role: "user"`. (Note: As per standard AG-UI/OpenAI Assistants API tool usage, this should actually be `role: "tool"` to submit tool output).
  - `tool_call_id: string`: Must contain the `tool_call_id` of the agent's `ToolCallStartEvent` (or `tool_calls` from an assistant message) that rendered the component.
  - `content: string`: A JSON string representing the user's interaction data specific to that component, which is the output/result of the tool.
  - Example (response to an `its:render_quick_quiz` tool call with `tool_call_id: "quiz_capital_france"`):
    ```json
    [{
      "id": "msg-tool-resp-002",
      "role": "tool",
      "tool_call_id": "quiz_capital_france",
      "name": "its:render_quick_quiz",
      "content": "{\"selected_option_id\": \"option_paris\"}"
    }]
    ```

#### 1.1.2. `context: Context[]` (Examples for ITS)
- Provides additional context to the agent.
- Example:
  ```json
  [
    {
      "description": "current_learning_topic",
      "value": "european_capitals"
    },
    {
      "description": "user_skill_level_geography",
      "value": "beginner"
    },
    {
      "description": "user_timezone",
      "value": "Europe/Paris"
    }
  ]
  ```
*(Note: Other `RunAgentInput` fields like `thread_id`, `run_id`, `tools`, `state` are used as per standard AG-UI specification.)*

## 2. Backend (BE) to Frontend (FE) Communication

The backend streams AG-UI events (Server-Sent Events) to the frontend. This includes standard lifecycle and text events, and ITS-specific tool calls to render rich UI components. The `type` field in each event payload corresponds to the `EventType` enum string from `@ag-ui/core` (e.g., "RUN_STARTED", "TEXT_MESSAGE_START").

### 2.1. Standard AG-UI Events
The ITS uses the following standard AG-UI events. Payloads are as per `@ag-ui/core` definitions.
- **`RunStartedEvent`** (`type: "RUN_STARTED"`)
- **`TextMessageStartEvent`** (`type: "TEXT_MESSAGE_START"`)
- **`TextMessageContentEvent`** (`type: "TEXT_MESSAGE_CONTENT"`)
- **`TextMessageEndEvent`** (`type: "TEXT_MESSAGE_END"`)
- **`ToolCallStartEvent`** (`type: "TOOL_CALL_START"`)
- **`ToolCallArgsEvent`** (`type: "TOOL_CALL_ARGS"`)
- **`ToolCallEndEvent`** (`type: "TOOL_CALL_END"`)
- **`RunFinishedEvent`** (`type: "RUN_FINISHED"`)
- **`RunErrorEvent`** (`type: "RUN_ERROR"`)
- **`StateDeltaEvent`** (`type: "STATE_DELTA"`) (Optional, for incremental state updates)
- **`StateSnapshotEvent`** (`type: "STATE_SNAPSHOT"`) (Optional, for full state updates)

*(Refer to `@ag-ui/core` documentation for the detailed payload schema of these standard events.)*

### 2.2. ITS-Specific Rich Component Rendering (via AG-UI Tool Calls)

The agent instructs the frontend to render ITS-specific rich components using the standard AG-UI tool calling mechanism. The agent's request to call a tool is streamed via `ToolCallStartEvent`, `ToolCallArgsEvent` (for arguments), and `ToolCallEndEvent`.

**General Flow:**
1. Agent sends `ToolCallStartEvent` with `tool_call_name` identifying the ITS component (e.g., `its:render_quick_quiz`) and a unique `tool_call_id`.
2. Agent streams component data (arguments) via one or more `ToolCallArgsEvent.delta`. The `delta` contains a JSON string fragment. These fragments, when concatenated, form a complete JSON object representing the arguments for the tool.
3. Agent sends `ToolCallEndEvent` to signal all arguments have been streamed.
4. The Frontend, upon receiving `ToolCallStartEvent`, identifies the tool by `tool_call_name`. It accumulates the argument fragments from `ToolCallArgsEvent` until `ToolCallEndEvent` is received. Then, it uses the complete arguments object to render the specified ITS component.
5. User interaction with this component results in the Frontend sending a `RunAgentInput` back to the BE. This input includes a `Message` with `role: "tool"`, the corresponding `tool_call_id`, the `name` of the tool that was executed, and `content` containing a JSON string of the interaction data (tool output). (See section 1.1.1 for example).

---

#### Specific ITS Component Tool Calls:

Below are definitions for ITS-specific components rendered via tool calls.

**1. `its:render_learning_track_carousel`**
- **Tool Call Name:** `its:render_learning_track_carousel`
- **Description:** Displays available learning tracks to the user in an interactive carousel or card layout.
- **Arguments JSON Schema (`ToolCallArgsEvent.delta` will be fragments of this):**
  ```json
  {
    "type": "object",
    "properties": {
      "tracks": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "track_id": { "type": "string", "description": "Unique identifier for the learning track." },
            "title": { "type": "string", "description": "Display title of the track." },
            "description": { "type": "string", "description": "Short description of the track." },
            "image_url": { "type": "string", "format": "uri", "description": "Optional URL for a track image." },
            "tags": { "type": "array", "items": { "type": "string" }, "description": "Relevant tags for filtering or display." }
          },
          "required": ["track_id", "title", "description"]
        }
      }
    },
    "required": ["tracks"]
  }
  ```
- **Full Arguments Example (what `ToolCallArgsEvent.delta` fragments combine to form):**
  ```json
  {
    "tracks": [
      {
        "track_id": "track_01",
        "title": "Introduction to Algebra",
        "description": "Learn the fundamental concepts of algebra, including variables, equations, and functions.",
        "image_url": "https://example.com/images/algebra.png",
        "tags": ["math", "beginner", "algebra"]
      },
      {
        "track_id": "track_02",
        "title": "Advanced Calculus",
        "description": "Explore differential and integral calculus in depth.",
        "image_url": "https://example.com/images/calculus.png",
        "tags": ["math", "advanced", "calculus"]
      }
    ]
  }
  ```
- **Expected User Interaction Data (JSON string in `Message.content` with `role: "tool"` and matching `tool_call_id`):**
  ```json
  {
    "selected_track_id": "track_01"
  }
  ```

---

**2. `its:render_skill_slider`**
- **Tool Call Name:** `its:render_skill_slider`
- **Description:** Allows the user to self-assess or indicate their proficiency for a given skill using a slider.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "skill_id": { "type": "string", "description": "Unique identifier for the skill." },
      "skill_name": { "type": "string", "description": "Display name of the skill." },
      "prompt_text": { "type": "string", "description": "Instructional text for the user (e.g., 'Rate your confidence in...')." },
      "min_value": { "type": "integer", "description": "Minimum value of the slider." },
      "max_value": { "type": "integer", "description": "Maximum value of the slider." },
      "current_value": { "type": "integer", "description": "Initial or current value on the slider." },
      "step": { "type": "integer", "default": 1, "description": "Step increment for the slider." }
    },
    "required": ["skill_id", "skill_name", "prompt_text", "min_value", "max_value"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "skill_id": "skill_js_arrays",
    "skill_name": "JavaScript Arrays",
    "prompt_text": "How comfortable are you with JavaScript Array methods?",
    "min_value": 0,
    "max_value": 10,
    "current_value": 3,
    "step": 1
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "skill_id": "skill_js_arrays",
    "selected_value": 7
  }
  ```

---

**3. `its:render_topic_buttons`**
- **Tool Call Name:** `its:render_topic_buttons`
- **Description:** Displays a set of buttons for the user to select a topic of interest or navigate.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "prompt_text": { "type": "string", "description": "Optional text displayed above the buttons." },
      "buttons": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "button_id": { "type": "string", "description": "Unique ID for the button, used in interaction data." },
            "label": { "type": "string", "description": "Text displayed on the button." },
            "topic_id_payload": { "type": "string", "description": "Payload associated with this button, typically a topic ID." }
          },
          "required": ["button_id", "label", "topic_id_payload"]
        }
      }
    },
    "required": ["buttons"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "prompt_text": "Which of these topics would you like to explore next?",
    "buttons": [
      { "button_id": "btn_vars", "label": "Variables", "topic_id_payload": "topic_variables_101" },
      { "button_id": "btn_loops", "label": "Loops", "topic_id_payload": "topic_loops_101" },
      { "button_id": "btn_funcs", "label": "Functions", "topic_id_payload": "topic_functions_101" }
    ]
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "button_id_clicked": "btn_loops",
    "topic_id_payload": "topic_loops_101"
  }
  ```

---

**4. `its:render_goal_selector`**
- **Tool Call Name:** `its:render_goal_selector`
- **Description:** Allows the user to select one or more learning goals from a predefined list.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "prompt_text": { "type": "string", "description": "Instructional text for the user." },
      "goals": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "goal_id": { "type": "string", "description": "Unique identifier for the goal." },
            "description": { "type": "string", "description": "Description of the learning goal." },
            "icon": { "type": "string", "description": "Optional icon name or URL associated with the goal." }
          },
          "required": ["goal_id", "description"]
        }
      },
      "allow_multiple_selection": { "type": "boolean", "default": false }
    },
    "required": ["prompt_text", "goals"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "prompt_text": "What are your learning goals for this session?",
    "goals": [
      { "goal_id": "goal_certification_prep", "description": "Prepare for a certification exam", "icon": "certificate.svg" },
      { "goal_id": "goal_project_building", "description": "Build a specific project", "icon": "project.svg" },
      { "goal_id": "goal_concept_understanding", "description": "Understand a specific concept", "icon": "concept.svg" }
    ],
    "allow_multiple_selection": true
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "selected_goal_ids": ["goal_certification_prep", "goal_concept_understanding"]
  }
  ```

---

**5. `its:render_code_assessment`**
- **Tool Call Name:** `its:render_code_assessment`
- **Description:** Presents a code-related assessment, which could be a multiple-choice question about code, a drag-and-drop code ordering task, or fill-in-the-blanks.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "assessment_id": { "type": "string", "description": "Unique identifier for this assessment." },
      "assessment_type": { "type": "string", "enum": ["mcq", "dnd_code_blocks", "fill_in_the_blanks"], "description": "Type of code assessment." },
      "problem_statement": { "type": "string", "description": "The question or instruction for the assessment." },
      "code_snippet": { "type": "string", "description": "Optional code snippet relevant to the question (may contain placeholders for fill-in-the-blanks)." },
      "choices": { "type": "array", "items": { "type": "object", "properties": { "id": {"type": "string"}, "text": {"type": "string"}}, "required": ["id", "text"]}, "description": "Choices for MCQ type." },
      "dnd_model": {
        "type": "object",
        "description": "Model for drag-and-drop type, specifying draggable items, drop zones, and their relationships. Structure is flexible based on specific component needs.",
        "additionalProperties": true
      },
      "blank_fields": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "blank_id": {"type": "string", "description": "Unique identifier for the blank field."},
            "label": {"type": "string", "description": "Optional label or hint text associated with the blank."},
            "correct_answers": {"type":"array", "items":{"type":"string"}, "description": "Optional list of correct answers for auto-grading or feedback."}
          },
          "required":["blank_id"]
        },
        "description": "Defines blanks for fill-in-the-blanks type."
      }
    },
    "required": ["assessment_id", "assessment_type", "problem_statement"]
  }
  ```
- **Full Arguments Example (MCQ):**
  ```json
  {
    "assessment_id": "code_assess_mcq_01",
    "assessment_type": "mcq",
    "problem_statement": "What will `console.log(typeof [])` output in JavaScript?",
    "code_snippet": "console.log(typeof []);",
    "choices": [
      {"id": "choice_array", "text": "\"array\""},
      {"id": "choice_object", "text": "\"object\""},
      {"id": "choice_undefined", "text": "\"undefined\""}
    ]
  }
  ```
- **Expected User Interaction Data (MCQ):**
  ```json
  {
    "assessment_id": "code_assess_mcq_01",
    "submitted_answer_id": "choice_object"
  }
  ```
- **Expected User Interaction Data (Drag-and-Drop - conceptual):**
  ```json
  {
    "assessment_id": "code_assess_dnd_01",
    "dropped_items_order": ["block_3", "block_1", "block_2"]
  }
  ```
- **Expected User Interaction Data (Fill-in-the-blanks - conceptual):**
  ```json
  {
    "assessment_id": "code_assess_fill_01",
    "filled_blanks": [
      { "blank_id": "blank_1", "user_input": "variable" },
      { "blank_id": "blank_2", "user_input": "let" }
    ]
  }
  ```

---

**6. `its:render_skill_mapper`**
- **Tool Call Name:** `its:render_skill_mapper`
- **Description:** Displays a visual representation of various skills, potentially with current mastery levels and options to interact or indicate interest.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "mapper_id": { "type": "string", "description": "Unique identifier for this skill mapper instance." },
      "skills": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "skill_id": { "type": "string" },
            "skill_name": { "type": "string" },
            "current_rating": { "type": "integer", "description": "Current self-assessed or system-assessed rating." },
            "max_rating": { "type": "integer", "description": "Maximum possible rating for the skill." },
            "description": { "type": "string" },
            "tags": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["skill_id", "skill_name", "max_rating"]
        }
      }
    },
    "required": ["mapper_id", "skills"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "mapper_id": "skillmap_frontend_basics",
    "skills": [
      { "skill_id": "html_basics", "skill_name": "HTML Basics", "current_rating": 4, "max_rating": 5, "description": "Understanding of HTML tags and structure." },
      { "skill_id": "css_flexbox", "skill_name": "CSS Flexbox", "current_rating": 2, "max_rating": 5, "description": "Layout with Flexbox." },
      { "skill_id": "js_dom_manip", "skill_name": "JS DOM Manipulation", "current_rating": 3, "max_rating": 5, "description": "Modifying web pages with JavaScript." }
    ]
  }
  ```
- **Expected User Interaction Data (if user updates a rating):**
  ```json
  {
    "mapper_id": "skillmap_frontend_basics",
    "updated_skills": [
      { "skill_id": "css_flexbox", "new_rating": 3 }
    ]
  }
  ```

---

**7. `its:render_time_selector`**
- **Tool Call Name:** `its:render_time_selector`
- **Description:** Allows the user to select a date, time, or time range, typically for scheduling or setting availability.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "selector_id": { "type": "string", "description": "Unique identifier for this time selector instance." },
      "selection_type": { "type": "string", "enum": ["date", "time", "datetime", "date_range", "time_range"], "description": "Type of time selection required." },
      "prompt_text": { "type": "string", "description": "Instructional text for the user." },
      "min_datetime": { "type": "string", "format": "date-time", "description": "Optional minimum selectable date/time." },
      "max_datetime": { "type": "string", "format": "date-time", "description": "Optional maximum selectable date/time." }
    },
    "required": ["selector_id", "selection_type", "prompt_text"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "selector_id": "availability_selector_01",
    "selection_type": "date_range",
    "prompt_text": "Select your availability for the next week:",
    "min_datetime": "2024-09-01T00:00:00Z",
    "max_datetime": "2024-09-07T23:59:59Z"
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "selector_id": "availability_selector_01",
    "selection": {
      "start_date": "2024-09-02",
      "end_date": "2024-09-04"
      // Or for datetime: "selected_datetime": "2024-09-02T10:00:00Z"
    }
  }
  ```

---

**8. `its:render_preference_cards`**
- **Tool Call Name:** `its:render_preference_cards`
- **Description:** Displays a set of interactive cards for users to select preferences (e.g., learning style, content type).
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "preference_set_id": { "type": "string", "description": "Unique identifier for this set of preference cards." },
      "prompt_text": { "type": "string" },
      "cards": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "card_id": { "type": "string" },
            "title": { "type": "string" },
            "description": { "type": "string" },
            "image_url": { "type": "string", "format": "uri" },
            "icon": { "type": "string" }
          },
          "required": ["card_id", "title", "description"]
        }
      },
      "allow_multiple_selection": { "type": "boolean", "default": true }
    },
    "required": ["preference_set_id", "prompt_text", "cards"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "preference_set_id": "learning_style_prefs",
    "prompt_text": "Which learning styles do you prefer?",
    "cards": [
      { "card_id": "style_visual", "title": "Visual Learner", "description": "Prefers diagrams, images, and videos.", "icon": "eye" },
      { "card_id": "style_auditory", "title": "Auditory Learner", "description": "Prefers lectures and discussions.", "icon": "ear" },
      { "card_id": "style_kinesthetic", "title": "Kinesthetic Learner", "description": "Prefers hands-on activities.", "icon": "hand-pointer" }
    ],
    "allow_multiple_selection": true
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "preference_set_id": "learning_style_prefs",
    "selected_card_ids": ["style_visual", "style_kinesthetic"]
  }
  ```

---

**9. `its:render_interactive_code_editor`**
- **Tool Call Name:** `its:render_interactive_code_editor`
- **Description:** Embeds a code editor for the user to write, modify, or run code snippets.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "editor_id": { "type": "string" },
      "language": { "type": "string", "enum": ["python", "javascript", "java", "html", "css"], "description": "Programming language for syntax highlighting and execution." },
      "initial_code": { "type": "string", "description": "Code to pre-populate the editor." },
      "problem_description": { "type": "string", "description": "Description of the task or problem to solve." },
      "config": {
        "type": "object",
        "properties": {
          "read_only": {"type": "boolean", "default": false},
          "show_run_button": {"type": "boolean", "default": true},
          "expected_output": {"type": "string"}
        },
        "description": "Configuration options for the editor instance."
      }
    },
    "required": ["editor_id", "language"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "editor_id": "code_editor_python_01",
    "language": "python",
    "initial_code": "def greet(name):\n  # Your code here\n  print(f\"Hello, {name}!\")\n\ngreet(\"World\")",
    "problem_description": "Complete the greet function to print a personalized greeting.",
    "config": {
      "show_run_button": true
    }
  }
  ```
- **Expected User Interaction Data (e.g., on submit or run):**
  ```json
  {
    "editor_id": "code_editor_python_01",
    "current_code": "def greet(name):\n  # Your code here\n  print(f\"Hello, {name}!\")\n\ngreet(\"Learner\")",
    "action": "submit_code" // or "run_code"
  }
  ```

---

**10. `its:render_diagram_viewer`**
- **Tool Call Name:** `its:render_diagram_viewer`
- **Description:** Displays visual diagrams, such as flowcharts or concept maps, using formats like MermaidJS, Draw.io data, or an image URL.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "diagram_id": { "type": "string" },
      "diagram_data": { "type": "string", "description": "The actual diagram data (e.g., Mermaid syntax, Draw.io XML, or an image URL)." },
      "diagram_type": { "type": "string", "enum": ["mermaid", "drawio_xml", "image_url"], "description": "Specifies the type of diagram data provided." },
      "caption": { "type": "string", "description": "Optional caption for the diagram." },
      "interactive": { "type": "boolean", "default": false, "description": "Whether the diagram should allow user interactions (e.g., clicking nodes)." }
    },
    "required": ["diagram_id", "diagram_data", "diagram_type"]
  }
  ```
- **Full Arguments Example (Mermaid):**
  ```json
  {
    "diagram_id": "concept_map_photosynthesis_01",
    "diagram_data": "graph TD;\nA[Sunlight] --> B(Chloroplasts);\nB --> C{Light-dependent Reactions};\nC --> D[ATP & NADPH];\nD --> E{Calvin Cycle};\nE --> F[Glucose];",
    "diagram_type": "mermaid",
    "caption": "Overview of Photosynthesis Stages",
    "interactive": false
  }
  ```
- **Expected User Interaction Data (if interactive, structure TBD based on interaction type):**
  ```json
  {
    "diagram_id": "concept_map_photosynthesis_01",
    "interaction_type": "node_click", // Example
    "node_id": "E" // Example if nodes have IDs in diagram_data
  }
  ```
  *(Note: For non-interactive diagrams, user interaction might be simply acknowledging or moving to the next step via a separate generic button or text input.)*

---

**11. `its:render_dnd_exercise`**
- **Tool Call Name:** `its:render_dnd_exercise`
- **Description:** Presents a generic drag-and-drop exercise where users match draggable items to drop zones.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "exercise_id": { "type": "string" },
      "prompt_text": { "type": "string", "description": "Instructions for the drag-and-drop exercise." },
      "draggables": {
        "type": "array",
        "items": { "type": "object", "properties": {"id":{"type":"string"}, "label":{"type":"string"}, "group":{"type":"string"}}, "required":["id", "label"]},
        "description": "Array of items that can be dragged."
      },
      "drop_zones": {
        "type": "array",
        "items": { "type": "object", "properties": {"id":{"type":"string"}, "label":{"type":"string"}, "accepts_group":{"type":"string"}}, "required":["id", "label"]},
        "description": "Array of zones where draggables can be dropped."
      }
    },
    "required": ["exercise_id", "prompt_text", "draggables", "drop_zones"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "exercise_id": "dnd_match_terms_01",
    "prompt_text": "Match the programming terms to their definitions.",
    "draggables": [
      {"id": "term_variable", "label": "Variable", "group": "terms"},
      {"id": "term_function", "label": "Function", "group": "terms"}
    ],
    "drop_zones": [
      {"id": "def_storage", "label": "A named storage location.", "accepts_group": "terms"},
      {"id": "def_block", "label": "A reusable block of code.", "accepts_group": "terms"}
    ]
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "exercise_id": "dnd_match_terms_01",
    "mapping": [ // Array of objects mapping draggable ID to drop zone ID
      { "draggable_id": "term_variable", "drop_zone_id": "def_storage" },
      { "draggable_id": "term_function", "drop_zone_id": "def_block" }
    ]
  }
  ```

---

**12. `its:render_progress_visualizer`**
- **Tool Call Name:** `its:render_progress_visualizer`
- **Description:** Displays user progress in a visual format (e.g., progress bar, circular progress, milestones).
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "visualizer_id": { "type": "string" },
      "type": { "type": "string", "enum": ["bar", "circular", "milestones"], "description": "Type of progress visualization." },
      "title": { "type": "string", "description": "Optional title for the visualizer." },
      "current_progress": { "type": "number", "description": "Current progress value (e.g., percentage or points)." },
      "total_value": { "type": "number", "description": "Total value for progress calculation (e.g., 100 for percentage)." },
      "milestones": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "achieved": { "type": "boolean" },
            "target_value": { "type": "number" }
          },
          "required": ["name", "achieved"]
        },
        "description": "Used if type is 'milestones'."
      }
    },
    "required": ["visualizer_id", "type"]
  }
  ```
- **Full Arguments Example (milestones):**
  ```json
  {
    "visualizer_id": "module1_progress",
    "type": "milestones",
    "title": "Module 1: Introduction to Python",
    "milestones": [
      { "name": "Chapter 1: Basics", "achieved": true, "target_value": 25 },
      { "name": "Chapter 2: Data Types", "achieved": true, "target_value": 50 },
      { "name": "Chapter 3: Control Flow", "achieved": false, "target_value": 75 },
      { "name": "Module Quiz", "achieved": false, "target_value": 100 }
    ]
  }
  ```
- **Expected User Interaction Data:** (Typically none directly from this component, as it's informational. Interactions would likely be via separate buttons or text inputs to proceed.)
  ```json
  {}
  ```
  *(Or could be a generic action like `{"visualizer_id": "module1_progress", "action": "acknowledged"}` if explicit confirmation is needed)*

---

**13. `its:render_quick_quiz`**
- **Tool Call Name:** `its:render_quick_quiz`
- **Description:** Displays a quick multiple-choice or true/false quiz question.
- **Arguments JSON Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "quiz_id": { "type": "string", "description": "Unique identifier for this quiz instance." },
      "question_text": { "type": "string", "description": "The text of the quiz question." },
      "options": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "description": "Unique ID for this option." },
            "text": { "type": "string", "description": "Display text for this option." }
          },
          "required": ["id", "text"]
        }
      },
      "quiz_type": {"type": "string", "enum": ["single-select-mcq", "true-false"], "default": "single-select-mcq"},
      "correct_answer_id_for_fe_feedback": { "type": "string", "description": "Optional: ID of the correct answer, if instant feedback is to be managed by FE. BE will still validate." }
    },
    "required": ["quiz_id", "question_text", "options"]
  }
  ```
- **Full Arguments Example:**
  ```json
  {
    "quiz_id": "quiz_capital_france_001",
    "question_text": "What is the capital of France?",
    "options": [
      {"id": "option_paris", "text": "Paris"},
      {"id": "option_london", "text": "London"},
      {"id": "option_berlin", "text": "Berlin"}
    ],
    "quiz_type": "single-select-mcq",
    "correct_answer_id_for_fe_feedback": "option_paris"
  }
  ```
- **Expected User Interaction Data:**
  ```json
  {
    "quiz_id": "quiz_capital_france_001",
    "selected_option_id": "option_paris"
  }
  ```

---
## 3. General Notes

- **User Identification:** User identity is established by the backend through the initial connection to the `/awp` endpoint (e.g., via authentication tokens/session cookies) and is associated with the `thread_id`.
- **Timestamps:** All timestamp fields should be ISO 8601 date-time strings (e.g., "2024-07-30T10:30:00Z").
- **Extensibility:** While these contracts define the initial set of interactions, new tool calls and context types can be added as the ITS evolves.

## Review and Sign-off

This AG-UI interaction contract requires review and sign-off by representatives from the frontend and backend development teams before final approval. Please track approvals via the project's standard review process.
```
