"""
WSGI entry point for PythonAnywhere deployment.

PythonAnywhere's free tier uses WSGI (not ASGI). This file wraps the
FastAPI/ASGI application so it can run on PythonAnywhere's WSGI server.

Setup instructions:
1. Open the Web tab on PythonAnywhere
2. Set the WSGI config file to point here
3. Set the virtualenv to your project's venv
4. Reload the web app

Requirements: pip install a2wsgi
"""

import os
import sys

# Add the project directory to the path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

# Use a2wsgi to wrap the FastAPI ASGI app as a WSGI app
from a2wsgi import ASGIMiddleware

# Import the FastAPI app
from src.main import app as fastapi_app

# Convert to WSGI for PythonAnywhere
application = ASGIMiddleware(fastapi_app)