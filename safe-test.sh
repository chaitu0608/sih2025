#!/bin/bash

# Safe Testing Script for Lethe
# This script helps you test the wiping tool safely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️ Lethe Safe Testing Guide${NC}"
echo "=================================="

echo -e "${YELLOW}⚠️  IMPORTANT SAFETY WARNINGS:${NC}"
echo "• NEVER test on your system drive (/dev/rdisk0)"
echo "• NEVER test on recovery partitions"
echo "• ALWAYS use a dedicated test USB drive"
echo "• ALWAYS backup important data first"
echo ""

# Function to check if device is safe to test
is_safe_device() {
    local device=$1
    
    # Check if it's a system drive
    if [[ "$device" == *"rdisk0"* ]]; then
        return 1
    fi
    
    # Check if it's a recovery drive
    if [[ "$device" == *"rdisk1"* ]]; then
        return 1
    fi
    
    # Check if it's mounted as system partition
    if mount | grep -q "$device.*/System\|$device.*/Applications"; then
        return 1
    fi
    
    return 0
}

# Function to get device info
get_device_info() {
    local device=$1
    echo -e "${BLUE}Device Information:${NC}"
    echo "Device: $device"
    
    # Get size
    local size=$(diskutil info "$device" 2>/dev/null | grep "Disk Size" | awk '{print $3, $4}' || echo "Unknown")
    echo "Size: $size"
    
    # Get mount point
    local mount=$(diskutil info "$device" 2>/dev/null | grep "Mount Point" | awk '{print $3}' || echo "Not mounted")
    echo "Mount Point: $mount"
    
    # Get file system
    local fs=$(diskutil info "$device" 2>/dev/null | grep "File System Personality" | awk '{print $4}' || echo "Unknown")
    echo "File System: $fs"
}

echo -e "${BLUE}📋 Safe Testing Steps:${NC}"
echo ""
echo "1. ${GREEN}Get a USB drive${NC} (8GB+ recommended)"
echo "2. ${GREEN}Plug it into your Mac${NC}"
echo "3. ${GREEN}Create some test files${NC} on the USB drive"
echo "4. ${GREEN}Note the device path${NC} (e.g., /dev/rdisk4)"
echo "5. ${GREEN}Test the wiping tool${NC} on the USB drive"
echo "6. ${GREEN}Verify the data is gone${NC}"
echo ""

echo -e "${BLUE}🔍 Current Storage Devices:${NC}"
echo ""

# List all devices and mark safe/unsafe
lethe list 2>/dev/null | while IFS= read -r line; do
    if [[ "$line" =~ ^/dev/ ]]; then
        device=$(echo "$line" | awk '{print $1}')
        if is_safe_device "$device"; then
            echo -e "${GREEN}✅ SAFE:${NC} $line"
        else
            echo -e "${RED}❌ UNSAFE:${NC} $line ${YELLOW}(System/Recovery drive)${NC}"
        fi
    else
        echo "$line"
    fi
done

echo ""
echo -e "${BLUE}🧪 Testing Commands:${NC}"
echo ""
echo "1. ${GREEN}Test device detection:${NC}"
echo "   ./lethe/target/release/lethe list"
echo ""
echo "2. ${GREEN}Test with a USB drive (replace /dev/rdiskX with your USB device):${NC}"
echo "   sudo ./lethe/target/release/lethe wipe /dev/rdiskX --scheme=zero --verify=no"
echo ""
echo "3. ${GREEN}Test via web interface:${NC}"
echo "   Open http://localhost:3001"
echo "   Select ONLY USB devices (not system drives)"
echo ""

echo -e "${YELLOW}⚠️  Before Testing:${NC}"
echo "• Make sure you have a USB drive plugged in"
echo "• Verify the device path (should be /dev/rdisk4 or higher)"
echo "• Create test files on the USB drive first"
echo "• Double-check you're selecting the USB drive, not system drives"
echo ""

echo -e "${BLUE}🔧 Quick USB Test Setup:${NC}"
echo ""
echo "1. ${GREEN}Plug in USB drive${NC}"
echo "2. ${GREEN}Create test file:${NC}"
echo "   echo 'This is a test file' > /Volumes/YourUSB/test.txt"
echo "3. ${GREEN}Verify file exists:${NC}"
echo "   ls -la /Volumes/YourUSB/"
echo "4. ${GREEN}Test wipe (replace /dev/rdiskX):${NC}"
echo "   sudo ./lethe/target/release/lethe wipe /dev/rdiskX --scheme=zero"
echo "5. ${GREEN}Verify file is gone:${NC}"
echo "   ls -la /Volumes/YourUSB/"
echo ""

echo -e "${RED}🚨 EMERGENCY STOP:${NC}"
echo "If you accidentally select the wrong device:"
echo "• Press Ctrl+C immediately"
echo "• The wipe process can be stopped"
echo "• But some data may already be lost"
echo ""

echo -e "${GREEN}✅ Safe Testing Checklist:${NC}"
echo "□ USB drive plugged in and recognized"
echo "□ Test files created on USB drive"
echo "□ Device path identified (/dev/rdiskX)"
echo "□ Confirmed it's NOT a system drive"
echo "□ Ready to test with zero-fill scheme"
echo ""

echo -e "${BLUE}Ready to test safely! 🚀${NC}"
