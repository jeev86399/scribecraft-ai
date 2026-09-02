#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Setting up ScribeCraft AI V4 GPU Training Environment in Colab..."
pip install -q -r "$DIR/requirements.txt"
echo "Setup Complete!"
