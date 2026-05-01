"""
Configuration
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    print("⚠️  WARNING: OPENAI_API_KEY not found in .env file")

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("⚠️  WARNING: DATABASE_URL not found in .env file")
    DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/manarah'

# Flask Configuration
DEBUG = os.getenv('FLASK_ENV') == 'development'
PORT = 5000

# Data Configuration (fallback to JSON files)
DATA_DIR = 'data'
USE_JSON_FALLBACK = os.getenv('USE_JSON_FALLBACK', 'false').lower() == 'true'