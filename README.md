# Smart Inventory Management System (Advanced)

A premium, enterprise-grade inventory management system built with Django and modern design principles. This platform features real-time tracking, advanced authentication (including Google OAuth), and a high-performance architecture.

## 🚀 Recent Upgrades
- **Architectural Clarity**: Clean separation of `backend`, `frontend`, `docs`, and `scripts`.
*   **Design System**: Luxury HSL-based design system with full **Dark Mode** support and Glassmorphic UI.
- **Advanced Auth**: Integrated **Google OAuth** via Allauth.
- **Professional Docs**: High-quality UML and Activity diagrams included in the `docs/` folder.

## 📁 Project Structure
The project is organized for scalability and clarity:

*   **[`backend/`](backend/)**: Core Django application, REST API, and data models.
*   **[`frontend/`](frontend/)**: Modern frontend assets and future head-less development space.
*   **[`docs/`](docs/)**: Documentation, including professional study diagrams.
*   **[`scripts/`](scripts/)**: Maintenance, data migration, and automation tools.

## 🖼️ Professional Diagrams
Standardized diagrams for the study are located in `docs/diagrams/`:
- **TAM Model**: Figure 2.1 (Technology Acceptance Model)
- **Systems Theory**: Figure 2.2
- **Architecture**: Figure 3.1 (Three-Tier Architecture)
- **UML Use Case**: Figure 3.2
- **UML Class Diagram**: Figure 3.3
- **Activity Diagram**: Figure 3.4 (Stock Alert Workflow)

## 🛠️ Installation & Setup

### 1. Environment Setup
```bash
# Activate your virtual environment
source venv/bin/activate

# Install dependencies for both backend and visualization
pip install -r backend/requirements.txt
pip install matplotlib  # Required for diagram generation
```

### 2. Database Initialization
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

### 3. Running the Platform
```bash
python manage.py runserver
```

## ✨ Design & Theme
The platform now supports a premium dark mode.
- **Theme Variables**: Defined in `backend/static/css/theme.css` using HSL tokens.
- **Persistence**: Theme choice is saved in local storage via `backend/static/js/theme.js`.
- **Aesthetics**: Glassmorphism, smooth animations, and Outfit/Inter typography.

## 🔒 Security Features
- **Allauth Integration**: Secure authentication with Google OAuth support.
- **Account Middleware**: Enhanced session and account management.
- **Rate Limiting**: Throttling on API endpoints to prevent abuse.
- **CSRF & XSS**: Standardized protection across all templates.

## 📈 Roadmap (Phase 2)
- [ ] Real-time stock alerts via WebSockets (Django Channels).
- [ ] Predictive restocking analysis using historical transaction data.
- [ ] Full headless frontend transition using Next.js/React.

---
*Maintained and Curated by Antigravity AI.*
