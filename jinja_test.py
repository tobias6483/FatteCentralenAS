# -*- coding: utf-8 -*-
# File: jinja_test.py - To be run from the project root.

import jinja2
import os
import sys
import traceback

print("--- Starting Jinja2 Test Script ---")
print(f"Python executable: {sys.executable}")
print(f"Jinja2 version: {jinja2.__version__}")

# Verify PROJECT_ROOT - it should be the directory containing this script
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
print(f"Project Root determined as: {PROJECT_ROOT}")

template_dir = os.path.join(PROJECT_ROOT, 'templates')

if not os.path.isdir(template_dir):
    print(f"\nERROR: Template directory NOT FOUND at path: {template_dir}")
    print(f"Please ensure this script is in the project root directory and the 'templates' folder exists there.")
    sys.exit(1) # Stop script if template folder not found

print(f"Using template directory: {template_dir}")

try:
    # Explicitly disable async just in case
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(template_dir),
        enable_async=False
    )
    print("Jinja2 Environment created successfully.")

    print("\n[Test 1] Attempting to load and parse _macros.html directly...")
    try:
        template = env.get_template('_macros.html')
        print("SUCCESS: Jinja successfully loaded and parsed _macros.html!")
    except jinja2.exceptions.TemplateSyntaxError as e:
        print(f"ERROR: TemplateSyntaxError during direct parsing of _macros.html!")
        print(f" -> File: {getattr(e, 'filename', 'N/A')}")
        print(f" -> Line: {getattr(e, 'lineno', 'N/A')}")
        print(f" -> Message: {getattr(e, 'message', 'N/A')}")
        print("\nFull Traceback:")
        traceback.print_exc()
    except Exception as e:
        print(f"ERROR: Unexpected error during direct parsing of _macros.html: {type(e).__name__}: {e}")
        print("\nFull Traceback:")
        traceback.print_exc()

    print("\n[Test 2] Attempting to parse a template string importing from _macros.html...")
    try:
        test_template_string = '{% from "_macros.html" import render_pagination %}'
        parsed_content = env.parse(test_template_string)
        print("SUCCESS: Jinja successfully parsed a template string importing from _macros.html!")
    except jinja2.exceptions.TemplateSyntaxError as e:
        print(f"ERROR: TemplateSyntaxError during import parsing!")
        print(f" -> File causing error: {getattr(e, 'filename', 'N/A')}") # Should point to _macros.html if error occurs
        print(f" -> Line number in that file: {getattr(e, 'lineno', 'N/A')}")
        print(f" -> Message: {getattr(e, 'message', 'N/A')}")
        print("\nFull Traceback:")
        traceback.print_exc()
    except Exception as e:
        print(f"ERROR: Unexpected error occurred during import parsing: {type(e).__name__}: {e}")
        print("\nFull Traceback:")
        traceback.print_exc()

except Exception as e:
    print(f"\nERROR: An unexpected error occurred setting up the Jinja environment: {type(e).__name__}: {e}")
    print("\nFull Traceback:")
    traceback.print_exc()

print("\n--- Jinja2 Test Script Finished ---")
