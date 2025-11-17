#!/bin/bash

# Test script for secure code execution system
BASE_URL="http://localhost:4000/api"

echo "======================================"
echo "Code Execution System Test Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test execution
test_execution() {
    local name=$1
    local code=$2
    local language=$3
    local expected_exit_code=${4:-0}
    
    echo -e "${YELLOW}Testing: $name${NC}"
    
    response=$(curl -s -X POST "$BASE_URL/execute" \
        -H "Content-Type: application/json" \
        -d "{\"code\":\"$code\",\"language\":\"$language\"}")
    
    exit_code=$(echo "$response" | grep -o '"exitCode":[0-9]*' | grep -o '[0-9]*')
    
    if [ "$exit_code" = "$expected_exit_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        echo "$response" | head -c 200
        echo ""
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Expected exit code: $expected_exit_code, Got: $exit_code"
        echo "$response"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Health check
echo "1. Health Check"
curl -s "$BASE_URL/health" | head -c 200
echo -e "\n"

# Get supported languages
echo "2. Supported Languages"
curl -s "$BASE_URL/languages"
echo -e "\n\n"

# Test Python
test_execution "Python Hello World" \
    "print('Hello from Python')" \
    "python" \
    0

test_execution "Python Math" \
    "print(2 + 2)" \
    "python" \
    0

# Test JavaScript
test_execution "JavaScript Hello World" \
    "console.log('Hello from JavaScript')" \
    "javascript" \
    0

test_execution "JavaScript Math" \
    "console.log(2 + 2)" \
    "javascript" \
    0

# Test C
test_execution "C Hello World" \
    "#include <stdio.h>\\nint main() {\\n  printf(\\"Hello from C\\\\n\\");\\n  return 0;\\n}" \
    "c" \
    0

# Test C++
test_execution "C++ Hello World" \
    "#include <iostream>\\nint main() {\\n  std::cout << \\"Hello from C++\\" << std::endl;\\n  return 0;\\n}" \
    "cpp" \
    0

# Test Go
test_execution "Go Hello World" \
    "package main\\nimport \\"fmt\\"\\nfunc main() {\\n  fmt.Println(\\"Hello from Go\\")\\n}" \
    "go" \
    0

# Test Java
test_execution "Java Hello World" \
    "public class Main {\\n  public static void main(String[] args) {\\n    System.out.println(\\"Hello from Java\\");\\n  }\\n}" \
    "java" \
    0

# Test TypeScript
test_execution "TypeScript Hello World" \
    "const message: string = 'Hello from TypeScript';\\nconsole.log(message);" \
    "typescript" \
    0

# Test HTML
test_execution "HTML" \
    "<html><body><h1>Hello</h1></body></html>" \
    "html" \
    0

# Test CSS
test_execution "CSS" \
    "body { color: red; }" \
    "css" \
    0

# Test Error Handling
test_execution "Python Syntax Error" \
    "print('missing quote)" \
    "python" \
    1

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "======================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
