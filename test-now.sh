#!/bin/bash
curl -s "http://localhost:3000/api/places/search?city=Tel%20Aviv" > /data/data/com.termux/files/home/test-results.json 2>&1
echo "Results saved to test-results.json"
