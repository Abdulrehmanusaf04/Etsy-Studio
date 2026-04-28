Business Requirements Document (BRD)
Etsy Digital Art Generation Studio
AI-Powered Web App for Etsy-Ready Digital Listing Assets

Field	Details
Version	1.0
Date	April 24, 2026
Prepared for	Client Approval and Development Team Implementation
Product Type	Web Application / AI Creative SaaS
Primary Stack	Next.js, Supabase, Gemini API

 
Table of Contents
•	1. Document Control
•	2. Business Overview
•	3. Definitions and Glossary
•	4. Assumptions and Constraints
•	5. Roles and Permissions
•	6. High Level System Modules
•	7. End to End Flow Diagrams
•	8. Functional Requirements - User Web App
•	9. Functional Requirements - Platform/System Admin
•	10. Data Requirements
•	11. Screen by Screen Requirements
•	12. Use Cases with Real Examples
•	13. Non Functional Requirements
•	14. Acceptance Criteria
•	15. Out of Scope Confirmations
 
1. Document Control
1.1 Purpose
This Business Requirements Document defines the complete business, functional, data, and non-functional requirements for the Etsy Digital Art Generation Studio web application. The platform enables users to generate complete, ready-to-upload Etsy digital listing assets for specific invitation and greeting card categories.
The system focuses on producing high-quality template designs, matching mockups, and Etsy listing descriptions through AI-assisted workflows. A critical business rule is that generated mockups must perfectly match the original template design without style drift.
The system includes:
•	User Web Application for creators and sellers
•	Supabase backend for authentication, database, storage, and authorization
•	AI generation layer using Gemini API through a controlled integration file such as gemini.ts
•	Asset Library for storing generated templates, mockups, descriptions, and presets
1.2 Intended Readers
•	Client stakeholders for approval
•	Product owner
•	Project manager
•	UI/UX designers
•	Frontend developers
•	Backend/Supabase developers
•	AI integration developers
•	QA engineers
•	Future operations/support team
1.3 Scope Summary
The platform will:
•	Allow users to sign up, sign in, and manage sessions through Supabase authentication
•	Restrict generation to approved Etsy digital product categories only
•	Provide a dashboard showing generation analytics and usage activity
•	Provide a manual Create workspace where users enter a prompt and optional references
•	Provide an Auto Generation workflow where users can generate without writing prompts
•	Generate two core template variants: with text and without text
•	Optionally generate 5-6 exploratory variations when enabled
•	Generate 8-10 Etsy-ready mockups per template
•	Generate a complete Etsy listing description including title, features, usage instructions, and download details
•	Save every generation automatically to the database and make it available in the Library
•	Allow users to download, reopen, edit, and regenerate previous generations
•	Allow users to create and manage reusable creative presets
Out of scope for the initial version:
•	Direct Etsy marketplace publishing or Etsy API listing upload
•	Payment gateway, subscription billing, or credit purchase system unless added in a later phase
•	Generation outside approved categories
•	Manual design editor comparable to Canva or Photoshop
•	Multi-user team workspace and role hierarchy unless added later
2. Business Overview
2.1 Business Goal
Build an AI-powered web app that helps Etsy sellers and digital product creators quickly generate complete listing-ready assets. The business goal is to reduce the time required to create digital invitation/card products by combining template generation, mockup generation, and listing copy generation in one streamlined workflow.
2.2 Product Vision
The app is designed to generate complete, ready-to-upload Etsy digital listings for restricted categories. Each generation must include high-quality template designs, 8-10 consistent mockups, and a complete Etsy listing description.
The product must feel clean, modern, minimal, and Etsy-inspired, while offering 2026-level UX standards such as smooth transitions, fast response, intuitive navigation, and minimal workflow friction.
2.3 Target Users
•	Etsy digital product sellers who create invitations, cards, and printable templates
•	Small business owners selling digital downloads
•	Freelance designers who need fast concept and mockup generation
•	Non-designers who want ready-to-upload Etsy assets without complex editing tools
•	Creative agencies managing reusable preset styles for multiple listing themes
2.4 Target Categories
Generation is restricted to the following categories:
•	Birthday Invitations
•	Wedding Invitations
•	Baby Shower Invitations
•	Bridal Shower Invitations
•	Valentine’s Day Cards
•	Gender Reveal Invitations
•	Greeting Cards
•	Christmas
•	Halloween
•	Special Occasions like 4th July
2.5 Core Business Rules
•	The system must not generate products outside approved categories.
•	Mockups must perfectly match the generated base template in layout, colors, typography, and visual style.
•	Every generation must produce a template with text and a clean template without text.
•	Every generation must be automatically saved to Supabase and linked to the authenticated user.
•	Users must only access their own generations and presets.
•	Generated assets must be usable for Etsy listings without requiring extra editing.
2.6 Technology Stack
Layer	Requirement
Frontend	Next.js
Backend and Database	Supabase
Authentication	Supabase Auth
Storage	Supabase Storage
AI Integration	Gemini API through gemini.ts
Environment Variables	Secure .env-based API key and Supabase configuration storage

3. Definitions and Glossary
Term	Definition
User	Authenticated creator or seller using the web app.
Generation	A complete AI output package containing templates, mockups, listing description, metadata, and settings.
Template	The base digital design generated for a selected category.
Template With Text	A template variant containing category-appropriate editable/visible text.
Template Without Text	A clean design-only template variant with no main event/listing text.
Mockup	A product display image that shows the template in realistic Etsy listing contexts.
Style Drift	Any mismatch between the base template and mockups, including changed colors, fonts, layout, or design identity.
Preset	A reusable creative direction containing title, description, system prompt, optional reference images, and style rules.
Manual Generation	Generation flow where the user provides a prompt and optional references.
Auto Generation	One-click generation flow based only on preset, resolution, aspect ratio, and category logic.
Library	User-owned storage area for templates, mockups, descriptions, and generation history.
Etsy Listing Description	AI-generated listing text including title, features, usage instructions, and download details.

4. Assumptions and Constraints
4.1 Assumptions
•	Gemini API is available and supports the required prompt refinement and visual generation workflow as implemented by the project.
•	Supabase is used for authentication, database, storage, and row-level authorization.
•	Users will provide prompts, presets, and optional references that comply with the approved categories.
•	Generated output quality depends on the prompt, selected preset, references, and AI model capabilities.
•	The application will store generated image URLs and metadata in Supabase for retrieval in the Library.
•	The MVP will focus on asset generation and management, not direct marketplace publishing.
4.2 Constraints
•	Generation must remain restricted to the approved categories.
•	API keys must never be exposed on the client side.
•	Users can only access their own generations and presets.
•	Mockup generation must preserve exact template visual identity.
•	The system must handle AI latency gracefully with loading states and progress feedback.
•	Large image uploads and generated assets must respect configured file size and storage limits.
•	If AI generation fails, the system must return a useful error state and must not create broken Library records.
5. Roles and Permissions
5.1 Roles
Guest / Visitor
•	Can view landing page and product explanation
•	Can access sign up and sign in pages
•	Cannot generate, save, or download assets unless authenticated
Authenticated User / Creator
•	Can access dashboard
•	Can create manual generations
•	Can use Auto Generation
•	Can generate mockups
•	Can create and manage presets
•	Can view Library
•	Can download owned assets
•	Can edit and regenerate owned generations
•	Can only access their own data
Platform Admin / Owner
•	Can monitor high-level app usage if an admin panel is implemented
•	Can manage allowed categories and global settings if required
•	Can review system errors and usage logs
•	Cannot access user private assets unless explicit support tools are implemented with audit logging
5.2 Permission Principles
•	Supabase Row Level Security must enforce user-owned data access.
•	Authenticated users can read, update, and delete only their own generations and presets.
•	Storage paths must be user-scoped.
•	Admin access, if added, must be role-restricted and audited.
•	Environment variables and AI API keys must be server-only.
6. High Level System Modules
6.1 User Web App Modules
•	Landing / Product Overview
•	Authentication and Session Management
•	Dashboard
•	Create - Manual Generation
•	Auto Generation - One-Click AI
•	Mockup Generation
•	Library
•	Preset Management
•	Editing and Regeneration
•	Download and Export
•	Settings / Account
6.2 Backend and AI Modules
•	Supabase Auth
•	Supabase Database
•	Supabase Storage
•	Row Level Security Policies
•	Gemini API Service Layer
•	Prompt Refinement Engine
•	Category Guardrail Engine
•	Generation History Service
•	Asset Metadata Service
•	Error Logging and Retry Handling
6.3 Content Output Modules
•	Template with text
•	Template without text
•	Optional 5-6 design variations
•	6-8 consistent Etsy mockups
•	Etsy listing title
•	Listing features
•	Usage instructions
•	Download details
•	Generated metadata and prompt history
7. End to End Flow Diagrams
7.1 Overall User Journey
[Visitor lands on app]
→ [Sign up / Sign in]
→ [Dashboard opens]
→ [Choose Manual Create or Auto Generation]
→ [Select category, preset, resolution, and aspect ratio]
→ [AI generates template with text + without text]
→ [User generates 8-10 matching mockups]
→ [System generates Etsy listing description]
→ [All assets auto-save to Library]
→ [User downloads or reopens for editing/regeneration]
7.2 Manual Create Flow
[User opens Create]
→ [User enters one-line prompt]
→ [Optional: Upload reference images]
→ [Optional: Select preset]
→ [Select category]
→ [Select resolution]
→ [Select aspect ratio]
→ [AI refines prompt using prompt + preset + references + category constraints]
→ [AI generates template with text and without text]
→ [Optional: AI generates 5-6 variations]
→ [System saves generation to database]
→ [User can download, mockup, edit, or regenerate]
7.3 Auto Generation Flow
[User opens Auto Generation]
→ [Select preset]
→ [Select category]
→ [Select resolution]
→ [Select aspect ratio]
→ [Click Generate]
→ [System uses preset internal logic without user prompt]
→ [AI generates template with text and without text]
→ [Optional variations created if enabled]
→ [Description generated]
→ [Assets saved to Library]
7.4 Mockup Generation Flow
[User selects a generated template]
→ [Click Generate Mockups]
→ [System locks base template style metadata]
→ [AI generates 8-10 mockups]
→ [Consistency validation checks layout, color, typography, and design identity]
→ [Mockups saved to Library]
→ [User downloads listing-ready mockup set]
7.5 Preset Management Flow
[User opens Preset Management]
→ [Create preset]
→ [Enter title, short description, detailed system prompt]
→ [Optional: Upload reference images]
→ [Save to Supabase]
→ [Preset becomes available in Create and Auto Generation]
→ [User can edit, duplicate, or delete preset]
7.6 Library and Regeneration Flow
[User opens Library]
→ [Browse generation history]
→ [Open generation detail]
→ [View templates, mockups, description, and settings]
→ [Modify prompt, preset, resolution, aspect ratio, or references]
→ [Regenerate new output]
→ [Save regenerated result as new version or new generation]
8. Functional Requirements - User Web App
8.1 Landing Page
Goal: Explain the product value and drive users to sign up or log in.
•	Hero section describing AI Etsy listing generation
•	Supported categories overview
•	Feature highlights: templates, mockups, descriptions, presets, Library
•	CTA buttons: Get Started, Sign In
•	Clean, minimal, Etsy-inspired design
8.2 Authentication
•	Users can sign up using email and password through Supabase Auth.
•	Users can sign in and maintain sessions securely.
•	Users can sign out.
•	Forgot password/reset flow should be supported if enabled by Supabase.
•	Unauthenticated users must be redirected away from protected pages.
8.3 Dashboard
Goal: Provide a high-level analytics overview for the user.
•	Total generations count
•	Recent user activity
•	Usage trends
•	Preset usage statistics
•	Recent Library items
•	Quick actions: Create, Auto Generate, Generate Mockups, Manage Presets
8.4 Create - Manual Generation
Goal: Primary workspace for AI-powered template creation based on user input.
Inputs
•	Prompt: required, one-line
•	Category: required, limited to approved category list
•	Reference images: optional
•	Preset selection: optional
•	Aspect ratio: 14:11
Processing Logic
•	AI refines the prompt using the user prompt, selected preset, uploaded references, and category constraints.
•	Prompt refinement must keep the output aligned with Etsy digital product use cases.
•	System must reject unsupported categories or route them to an allowed category selection step.
•	The generation record must store the original prompt, refined prompt, settings, and selected preset ID.
Output
•	Template with text
•	Template without text
•	Optional 5-6 variations for exploration if enabled
•	Auto-generated Etsy description
•	Downloadable output files
•	Auto-saved Library record
Must Behavior
Prompt-Based Template Generation: The system must dynamically generate templates strictly based on user input and context, producing category-aware, Etsy-ready outputs.
8.5 Auto Generation - One-Click AI
Goal: Provide a fully automated generation alternative that does not require a user-written prompt.
Workflow
•	Select preset
•	Select category
•	Select aspect ratio
•	Click Generate
Behavior
•	No prompt required from user.
•	System uses preset internal logic and category-specific rules.
•	AI generates complete templates automatically.
•	Output structure must match Manual Create output.
Must Behavior
Predefined AI Template Generation: The system produces ready-to-use templates aligned with preset themes without manual prompt input.
8.6 Mockup Section
Goal: Generate Etsy-ready listing visuals that perfectly match the base template design.
Core Requirements
•	Generate 8-10 mockups per template.
•	Mockups must be 100% consistent with the base template.
•	Mockups must preserve layout, color palette, typography, composition, and design integrity.
•	Mockup generation must work with one click.
•	No manual adjustment should be required for standard output.
Theme Alignment Rules
•	Birthday Invitations: festive, colorful, celebratory
•	Wedding Invitations: elegant, romantic, premium
•	Baby Shower Invitations: soft, playful, gentle
•	Bridal Shower Invitations: chic, feminine, stylish
•	Valentine’s Day Cards: romantic, warm, expressive
•	Gender Reveal Invitations: playful, joyful, pink/blue or theme-aware
•	Greeting Cards: versatile, emotional, occasion-aware
•	Halloween: Spooky Dark Mysterious
•	Christmas: Warm Festive Joyful
•	Special Occasions (4th July): Patriotic Bright Celebratory
Additional Output
•	Full Etsy listing title
•	Features section
•	Usage instructions
•	Download details
•	Suggested listing keywords/tags if enabled
8.7 Library
Goal: Central storage for all generated and reusable assets.
•	Store templates
•	Store mockups
•	Store descriptions
•	Store generation settings
•	Store prompt/refined prompt history
•	View generation history
•	Download assets
•	Edit and regenerate
•	Organized gallery layout
•	Filter by category, preset, date, and type if implemented
8.8 Preset Management
Goal: Allow users to define reusable creative directions.
Preset Fields
•	Title
•	Short description
•	Detailed system prompt
•	Reference images optional
•	Category preference optional
•	Style tags optional
•	Created/updated timestamps
Functionality
•	Create preset
•	View preset
•	Update preset
•	Delete preset
•	Duplicate preset optional
•	Use preset in Create and Auto Generation
Preset Influence
•	Style such as minimal, floral, modern, luxury, playful
•	Theme direction
•	Color palette
•	Typography direction
•	Composition direction
•	Category-specific visual rules
8.9 Editing and Regeneration
•	Users can reopen past generations.
•	Users can modify prompt, preset, category, resolution, aspect ratio, and references.
•	Users can regenerate new variations.
•	System must not overwrite old output unless user explicitly chooses to replace.
•	Recommended behavior: create a new generation version for traceability.
8.10 Downloads and Export
•	Users can download individual template images.
•	Users can download mockup images.
•	Users can copy/download Etsy listing description.
•	Optional: Download complete generation as ZIP.
•	Generated file names should be clean and category/preset aware.
8.11 Error Handling
•	Show clear loading state during AI generation.
•	Show retry option if generation fails.
•	Do not save incomplete broken assets as final generations.
•	Log failed generation status for debugging.
•	If mockup consistency fails, allow regeneration of mockups from same base template.
9. Functional Requirements - Platform/System Admin
The provided product idea focuses mainly on user-facing features. The following system/admin requirements are recommended for stable operations and can be implemented as internal tooling or database-level controls.
9.1 Configuration Management
•	Manage approved category list
•	Manage default aspect ratio options
•	Manage max reference image upload limits
•	Manage AI generation feature flags such as optional variations
•	Manage prompt safety and category restriction rules
9.2 Usage Monitoring
•	Track total generations
•	Track failed generations
•	Track average generation time
•	Track storage usage
•	Track preset usage patterns
•	Track most used categories
9.3 AI Service Controls
•	Store API keys only in environment variables.
•	Route all Gemini API requests through server-side code.
•	Maintain reusable prompt templates for manual generation, auto generation, mockup generation, and description generation.
•	Add retry and fallback logic for temporary AI failures.
•	Log AI request metadata without exposing private API keys.
9.4 Security and Access Controls
•	Use Supabase Row Level Security for all user-owned tables.
•	Use signed/private storage paths when needed.
•	Prevent users from reading or modifying other users’ presets or generations.
•	Validate file uploads by type and size.
•	Sanitize user-provided prompts and preset content before processing.
10. Data Requirements
10.1 Core Entities and Key Fields
User
•	id
•	email
•	full_name optional
•	avatar_url optional
•	created_at
•	updated_at
•	last_login_at optional
Preset
•	id
•	user_id FK to User
•	title
•	short_description
•	detailed_system_prompt
•	reference_images_json optional
•	style_tags_json optional
•	default_category optional
•	default_resolution optional
•	default_aspect_ratio optional
•	created_at
•	updated_at
Generation
•	id
•	user_id FK to User
•	preset_id optional
•	source_type enum: manual, auto
•	category enum
•	original_prompt nullable for auto generation
•	refined_prompt
•	resolution
•	aspect_ratio
•	status enum: queued, processing, completed, failed
•	template_with_text_url
•	template_without_text_url
•	variations_json optional
•	etsy_description_id optional
•	settings_json
•	created_at
•	updated_at
Generation Asset
•	id
•	generation_id FK
•	user_id FK
•	asset_type enum: template_with_text, template_without_text, variation, mockup, reference_image
•	file_url
•	file_name
•	file_size
•	mime_type
•	width optional
•	height optional
•	metadata_json
•	created_at
Mockup Set
•	id
•	generation_id FK
•	user_id FK
•	base_template_asset_id
•	mockup_count
•	consistency_status enum: pending, passed, failed, manual_review
•	mockup_assets_json
•	created_at
•	updated_at
Etsy Description
•	id
•	generation_id FK
•	user_id FK
•	title
•	description_body
•	features_json
•	usage_instructions
•	download_details
•	tags_json optional
•	created_at
•	updated_at
Generation Version
•	id
•	parent_generation_id
•	user_id FK
•	version_number
•	changed_fields_json
•	new_generation_id
•	created_at
AI Request Log
•	id
•	user_id FK
•	generation_id optional
•	request_type enum: prompt_refinement, template_generation, auto_generation, mockup_generation, description_generation
•	status enum: success, failed
•	error_message optional
•	duration_ms optional
•	created_at
10.2 Data Rules
•	Every generation must be linked to one user.
•	Every preset must be linked to one user.
•	All user-owned data must be protected by Row Level Security.
•	Generated assets must be retrievable from Library.
•	Failed generations must store enough metadata to troubleshoot without showing broken assets as completed.
•	Deleting a preset must not delete historical generations that used it; the generation should retain a snapshot of preset influence.
•	Deleting a generation should soft-delete records or remove assets based on storage policy.
11. Screen by Screen Requirements
11.1 User Web App Screens
1.	Home / Landing Page
2.	Sign Up
3.	Sign In
4.	Forgot Password / Reset Password
5.	Dashboard
6.	Create - Manual Generation
7.	Auto Generation
8.	Generation Result Detail
9.	Mockup Generator
10.	Library Gallery
11.	Library Detail View
12.	Preset List
13.	Create/Edit Preset
14.	Account Settings
15.	Error / Empty State Screens
11.2 Recommended Admin/System Screens
16.	System Dashboard
17.	Usage Logs
18.	Generation Logs
19.	Storage Usage
20.	Category Settings
21.	Prompt Template Settings
22.	Error Monitoring
23.	User Support View if required
12. Use Cases with Real Examples
12.1 Manual Generation Use Case
Scenario: A seller wants to create a floral wedding invitation listing.
24.	User signs in and opens Create.
25.	User selects Wedding Invitations.
26.	User writes: “Elegant blush floral wedding invitation with soft script typography.”
27.	User selects 4:5 portrait and 2K resolution.
28.	User optionally selects a floral/luxury preset.
29.	AI refines the prompt and generates template with text and without text.
30.	User clicks Generate Mockups and receives 6-8 matching mockups.
31.	System generates Etsy title, description, features, usage instructions, and download details.
32.	All assets are saved to Library.
33.	User downloads final assets and uploads them to Etsy manually.
12.2 Auto Generation Use Case
Scenario: A user wants quick birthday invitation ideas without writing a prompt.
34.	User opens Auto Generation.
35.	User selects a colorful birthday preset.
36.	User selects Birthday Invitations.
37.	User clicks Generate.
38.	System generates template with text, template without text, optional variations, and listing description.
39.	User generates mockups in one click.
40.	All assets are saved automatically to Library.
12.3 Preset Management Use Case
Scenario: A designer wants a reusable minimalist style.
41.	User opens Preset Management.
42.	User creates a preset titled “Minimal Neutral Wedding”.
43.	User adds a short description and detailed system prompt describing neutral colors, serif typography, and clean spacing.
44.	User uploads reference images if needed.
45.	User saves the preset.
46.	Preset becomes available in Create and Auto Generation.
47.	Later generations follow this preset’s style direction.
12.4 Library and Regeneration Use Case
Scenario: A user wants to improve a previous Valentine card design.
48.	User opens Library.
49.	User filters by Valentine’s Day Cards.
50.	User opens a previous generation.
51.	User changes the prompt to make the design more modern and romantic.
52.	User regenerates new variations.
53.	System saves the new result as a new version or new generation.
54.	User downloads the improved assets.
13. Non Functional Requirements
13.1 Security
•	Secure authentication through Supabase Auth
•	Row Level Security for user-owned data
•	Server-side Gemini API calls only
•	Environment variables for API keys
•	File upload validation
•	Protected routes for dashboard, Create, Auto Generation, Library, and Presets
•	Optional audit logs for admin/support actions
13.2 Performance
•	Fast dashboard and Library loading through indexed queries and pagination
•	Progress indicators during AI generation
•	Lazy loading for image-heavy galleries
•	Optimized image preview sizes
•	Graceful handling of long-running AI requests
•	Avoid blocking UI during asset generation
13.3 Reliability and Backups
•	Supabase database backups enabled according to selected plan
•	Storage redundancy based on Supabase configuration
•	Generation status tracking to prevent lost outputs
•	Retry support for failed AI requests
•	Error logging for failed prompts, storage writes, and database operations
13.4 Compatibility
•	Modern desktop browsers
•	Mobile responsive layout for core user pages
•	Image preview compatibility across common browsers
•	Admin/system screens optimized for desktop if implemented
13.5 UX and Design
•	Etsy-inspired clean and minimal white UI
•	Smooth transitions
•	Clear empty states
•	Minimal friction generation workflows
•	Clear visual difference between manual and auto generation
•	Consistent cards, galleries, buttons, and form controls
13.6 AI Output Quality
•	Category-aware template generation
•	Strict prompt/preset adherence
•	No mockup style drift
•	Consistent typography and color palette between template and mockups
•	Clear Etsy-ready listing copy
•	Regeneration options for unsatisfactory output
14. Acceptance Criteria
•	User can sign up, sign in, maintain session, and sign out.
•	Protected pages are inaccessible without authentication.
•	Dashboard displays total generations, user activity, usage trends, and preset usage stats.
•	User can create a manual generation with prompt, category, optional references, preset, resolution, and aspect ratio.
•	Manual generation produces template with text and template without text.
•	Optional variations produce 5-6 exploration outputs when enabled.
•	Auto Generation works without a manual prompt and uses preset logic.
•	Generation is restricted to approved categories only.
•	Mockup section generates 8-10 mockups per template.
•	Mockups match the base template in layout, colors, typography, and design identity.
•	System generates Etsy listing description including title, features, usage instructions, and download details.
•	Every completed generation is automatically saved to Supabase.
•	Library shows saved templates, mockups, descriptions, and generation history.
•	User can download assets from Library.
•	User can reopen and regenerate previous generations with modified inputs.
•	User can create, edit, delete, and use presets.
•	Presets influence style, theme, color palette, typography, and composition.
•	Users can only access their own generations and presets.
•	API keys are stored securely and not exposed in frontend code.
•	Failed generation states are handled gracefully with user-friendly error messages.
15. Out of Scope Confirmations
•	No direct Etsy API publishing in MVP.
•	No payment gateway or subscription billing unless added in a later phase.
•	No unrestricted image generation outside approved categories.
•	No advanced Canva-like manual drag-and-drop editor.
•	No collaborative multi-user workspaces in initial scope.
•	No guaranteed AI perfection; regeneration and consistency checks are provided to improve output quality.
•	No marketplace SEO analytics unless added later.
•	No printing, shipping, or physical product fulfillment workflows.
Appendix A - Non-Negotiable Product Rules
•	Category-restricted generation only.
•	Template and mockups must match exactly.
•	Mockups generated in one click.
•	Output must be Etsy-ready with no extra editing required for standard use.
•	All assets must be stored and reusable.
•	Every generation must be linked to the authenticated user.
•	Supabase authorization must prevent cross-user data access.
