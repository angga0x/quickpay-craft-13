#!/bin/bash

# Reference ID from your transaction
REF_ID="test_xld_004"  # Replace with your transaction reference ID

# Function to check status
check_status() {
    curl -X POST http://localhost:3000/api/transaction/status \
        -H "Content-Type: application/json" \
        -d "{\"ref_id\": \"$REF_ID\"}"
    echo -e "\n---\n"
}

echo "Starting status check for reference ID: $REF_ID"
echo "Press Ctrl+C to stop"

# Loop every minute
while true; do
    echo "Checking status at $(date)"
    check_status
    sleep 60
done 