#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Coupons Management - Dev Servers${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Check if API server is running
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo -e "   Killing existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

# Check if Web server is running
if check_port 5173; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use${NC}"
    echo -e "   Killing existing process..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
fi

# Check if Client Web server is running
if check_port 5175; then
    echo -e "${YELLOW}⚠️  Port 5175 is already in use${NC}"
    echo -e "   Killing existing process..."
    lsof -ti:5175 | xargs kill -9 2>/dev/null
fi

echo ""
echo -e "${GREEN}Starting servers...${NC}"
echo ""

# Start API server
echo -e "${GREEN}📡 Starting API Server (port 3000)...${NC}"
cd packages/api
bun run dev > ../../logs/api.log 2>&1 &
API_PID=$!
echo -e "   PID: $API_PID"

# Wait for API to start
sleep 3

# Start Admin Web server
echo -e "${GREEN}🌐 Starting Admin Web Server (port 5173)...${NC}"
cd ../web
bun run dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
echo -e "   PID: $WEB_PID"

# Start Client Web server
echo -e "${GREEN}📱 Starting Client Web Server (port 5175)...${NC}"
cd ../client-web
bun run dev > ../../logs/client-web.log 2>&1 &
CLIENT_PID=$!
echo -e "   PID: $CLIENT_PID"

cd ../..

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Servers Started!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "API Server:    ${GREEN}http://localhost:3000${NC}"
echo -e "Admin Web:     ${GREEN}http://localhost:5173${NC}"
echo -e "Client Web:    ${GREEN}http://localhost:5175${NC}"
echo ""
echo -e "Logs:"
echo -e "  API:    ${YELLOW}tail -f logs/api.log${NC}"
echo -e "  Admin:  ${YELLOW}tail -f logs/web.log${NC}"
echo -e "  Client: ${YELLOW}tail -f logs/client-web.log${NC}"
echo ""
echo -e "To stop servers:"
echo -e "  ${RED}kill $API_PID $WEB_PID $CLIENT_PID${NC}"
echo ""
