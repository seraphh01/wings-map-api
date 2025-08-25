# AWS Lambda Node.js 18 base image
FROM public.ecr.aws/lambda/nodejs:18

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all source code
COPY . .

# Set the Lambda handler (index.handler)
CMD ["index.handler"]
