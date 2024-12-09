# Base image
FROM ubuntu:22.04

# Update packages (optional)
RUN apt-get update && apt-get upgrade -y

# Copy the entire docker folder
COPY docker/ .

# Set working directory
WORKDIR /from-source

# Make the script executable (optional)
RUN chmod +x build.sh

# Run the build script
CMD ["build.sh"]