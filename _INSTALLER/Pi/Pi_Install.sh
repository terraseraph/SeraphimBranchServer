#!/bin/bash
PROJ = $(pwd)
# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

# Rerun Profile script to start NVM
source ~/.bashrc  # Rerun profile after installing nvm

# Install Node.js using Node Version Manager
nvm install 10.15.0  # Installs Node v10.15.0, (nvm install stable) installs Latest version of node
nvm use 10.15.0  # Sets Node to use v10.15.0

cd $PROJ
cd ../..
npm install