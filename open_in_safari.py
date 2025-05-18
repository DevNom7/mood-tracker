import os
import webbrowser
from pathlib import Path

# Get the absolute path to index.html
current_dir = Path(__file__).parent
html_path = current_dir / 'index.html'
html_url = f'file://{html_path.absolute()}'

# Open in Safari
webbrowser.get('safari').open(html_url) 