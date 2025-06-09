---
task_id: 4
title: "Production Infrastructure Setup (Hosting, DB, Temporal Cluster)"
epic: "EPIC-005"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-001/8"] # Depends on Backend Containerization knowledge
parallel_work: ["EPIC-005_TASK_5"] # CI/CD for deployment uses this infra
blocking_dependencies: ["EPIC-001/8"]
contract_dependencies: []
phase: "polish"
---

# Task Overview
This task involves provisioning and configuring the production-level infrastructure required to host the Intelligent Tutoring System. This includes setting up hosting for the Next.js frontend, the FastAPI backend (likely containerized), the Supabase database (if not using a fully managed cloud instance, or configuring the production instance settings), and the Temporal.io cluster (e.g., setting up Temporal Cloud or a self-hosted production-grade cluster).

## Business Context
A stable, scalable, and secure production infrastructure is the foundation for delivering the ITS to users. Proper setup ensures reliability, performance, and maintainability of the live application. This task moves the project from development environments to a production-ready state.

## Acceptance Criteria
- [ ] **Frontend Hosting:** Production hosting for the Next.js frontend is provisioned and configured (e.g., Vercel, Netlify, AWS Amplify/S3+CloudFront).
  - [ ] Custom domain (if any) is configured.
  - [ ] HTTPS is enabled.
- [ ] **Backend Hosting:** Production hosting for the containerized FastAPI backend is provisioned and configured (e.g., AWS ECS/EKS, Google Cloud Run/GKE, DigitalOcean App Platform, Railway, Render).
  - [ ] Auto-scaling configured if applicable and desired.
  - [ ] Environment variables (for Supabase URL, Temporal address, LLM keys, etc.) are securely configured.
  - [ ] HTTPS is enabled (typically via load balancer or platform feature).
- [ ] **Database (Supabase):** Production Supabase project is ready.
  - [ ] If self-hosting Supabase components, they are set up for production load.
  - [ ] If using Supabase Cloud, the production project is configured with appropriate resources, backup policies, and security settings (e.g., RLS, network restrictions).
- [ ] **Temporal Cluster:** A production-grade Temporal.io cluster is provisioned.
  - [ ] If using Temporal Cloud: account set up, namespace created, connection details secured.
  - [ ] If self-hosting Temporal: cluster deployed (e.g., on Kubernetes) with persistence, scalability, and observability in mind.
- [ ] Network configurations (firewalls, VPCs if applicable) are set up to allow secure communication between services and protect from unauthorized access.
- [ ] Initial cost estimates for the production infrastructure are reviewed.
- [ ] Access credentials for all production services are securely managed.

## Service Layer TDD Approach
### Test Strategy
- Infrastructure setup is not typically "TDD'd" in the code sense.
- Testing involves verifying connectivity between components, successful deployment of application stubs, and basic health checks against the provisioned services.
- "Infrastructure as Code" (IaC) tools (e.g., Terraform, CloudFormation, Pulumi), if used, can be linted and validated.

### Key Test Scenarios (Verification Steps)
- Frontend hosting serves the basic application (e.g., a static page or login screen).
- Backend hosting can run the containerized application; `/health` endpoint is accessible and returns 200 OK.
- Backend can successfully connect to the production Supabase instance.
- Backend can successfully connect to the production Temporal cluster and register/start a simple test workflow.
- Basic security checks (e.g., HTTPS enforced, unnecessary ports closed).

## Technical Specifications
### Service Interface Design
- Not applicable directly, but this task ensures the infrastructure can support the defined service interfaces of the application.

### Implementation Guidance
- **Frontend:** Choose a platform optimized for Next.js (like Vercel or Netlify) for ease of deployment and features like serverless functions, CDN.
- **Backend:** Choose a container orchestration platform or PaaS that fits the team's expertise and scaling needs. Ensure secure management of secrets/environment variables (e.g., using AWS Secrets Manager, HashiCorp Vault, or platform-native secret stores).
- **Supabase:** For production, Supabase Cloud is often preferred for its managed nature unless specific self-hosting requirements exist. Review Supabase's production readiness checklist. Enable Point-in-Time Recovery (PITR) if available/needed.
- **Temporal:** Temporal Cloud is recommended for ease of use and maintenance. If self-hosting, follow Temporal's production deployment guides carefully, ensuring proper setup of persistence store (e.g., PostgreSQL, Cassandra) and frontend/worker services.
- **Infrastructure as Code (Optional but Recommended):** Consider using tools like Terraform or Pulumi to define and manage cloud infrastructure programmatically. This improves reproducibility and maintainability.
- **Security:** Prioritize security best practices: least privilege access, network segmentation, encrypted communications, secure secret management.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001_TASK_8` (Backend Containerization) - the backend needs to be containerized before it can be deployed to most modern hosting platforms. A basic understanding of the application's resource needs.
- **Contract Dependencies**: None directly.
- **Parallel Work Opportunities**: Can be done in parallel with `EPIC-005_TASK_5` (Finalize CI/CD Pipeline), as the CI/CD pipeline will target this infrastructure. Also parallel with final testing tasks.
- **Mock Requirements**: Not applicable for infrastructure setup.
- **Integration Points**: This infrastructure is where all application components (FE, BE, DB, Temporal) will be deployed and integrated in a production setting.

## Definition of Done
- [ ] All necessary production hosting environments (FE, BE, DB, Temporal) are provisioned and configured.
- [ ] Basic connectivity tests between components in the production environment pass.
- [ ] Secure management of environment variables and access credentials is in place.
- [ ] Initial documentation of the production infrastructure setup (key services, access points) is created.

## Technical Notes
- This task can be complex and time-consuming, depending on the chosen platforms and the team's existing infrastructure expertise.
- Start with minimal viable production setups and scale/harden them as needed based on load and monitoring.
- Cost optimization should be considered, but reliability and security are paramount for production.
- Ensure monitoring and logging solutions (Task 5.6) can be integrated with this infrastructure.
