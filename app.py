import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__, template_folder='templates', static_folder='static')

# Configuration for major variables (though not directly used in this simple Flask app)
# This is more for the JS part as per instructions
APP_TITLE = "Zombie Annihilation"

@app.route('/')
def index():
    """Serves the main game page."""
    try:
        print(f'Serving {APP_TITLE} - index.html') # termcolor can be added here if desired for backend logs
        return render_template('index.html')
    except Exception as e:
        print(f"Error rendering index.html: {e}")
        return "Error loading game. Please check server logs.", 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serves static files (CSS, JS, images etc.)."""
    try:
        return send_from_directory(app.static_folder, filename)
    except FileNotFoundError:
        print(f"Error: Static file not found: {filename}")
        return "File not found", 404
    except Exception as e:
        print(f"Error serving static file {filename}: {e}")
        return "Error serving file.", 500

if __name__ == '__main__':
    # termcolor could be used here to print startup messages
    print(f'{APP_TITLE} server starting...')
    # Ensure the static and templates directories exist
    if not os.path.exists('static'):
        os.makedirs('static')
        print("Created 'static' directory.")
    if not os.path.exists('templates'):
        os.makedirs('templates')
        print("Created 'templates' directory.")
    app.run(debug=True, host='0.0.0.0', port=5000) 