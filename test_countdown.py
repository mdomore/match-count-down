#!/usr/bin/env python3
"""Test script for countdown API"""
import requests
import time
import json
try:
    import websockets
    import asyncio
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("Note: websockets module not available, skipping WebSocket tests")

BASE_URL = "http://127.0.0.1:8004"
WS_BASE = "ws://127.0.0.1:8004"

def test_create_countdown():
    print("=" * 50)
    print("Test 1: Create Countdown")
    print("=" * 50)
    r = requests.post(f"{BASE_URL}/countdowns", json={
        "sport_id": "football",
        "mode": "countdown",
        "team1_name": "Team Alpha",
        "team2_name": "Team Beta"
    })
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Created countdown: {data['id']}")
        print(f"Time left: {data['time_left']} seconds")
        return data['id']
    else:
        print(f"Error: {r.text}")
        return None

def test_get_countdown(countdown_id):
    print("\n" + "=" * 50)
    print("Test 2: Get Countdown")
    print("=" * 50)
    r = requests.get(f"{BASE_URL}/countdowns/{countdown_id}")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Countdown state: {data['state']}")
        print(f"Time left: {data['time_left']} seconds")
        return True
    else:
        print(f"Error: {r.text}")
        return False

def test_start_countdown(countdown_id):
    print("\n" + "=" * 50)
    print("Test 3: Start Countdown")
    print("=" * 50)
    r = requests.post(f"{BASE_URL}/countdowns/{countdown_id}/start")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("Countdown started")
        time.sleep(3)
        r2 = requests.get(f"{BASE_URL}/countdowns/{countdown_id}")
        if r2.status_code == 200:
            data = r2.json()
            print(f"After 3 seconds: {data['time_left']} seconds left")
            print(f"State: {data['state']}")
        return True
    else:
        print(f"Error: {r.text}")
        return False

def test_pause_countdown(countdown_id):
    print("\n" + "=" * 50)
    print("Test 4: Pause Countdown")
    print("=" * 50)
    r = requests.post(f"{BASE_URL}/countdowns/{countdown_id}/pause")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("Countdown paused")
        time.sleep(1)
        r2 = requests.get(f"{BASE_URL}/countdowns/{countdown_id}")
        if r2.status_code == 200:
            data = r2.json()
            time_left = data['time_left']
            print(f"Time left after pause: {time_left} seconds")
            time.sleep(2)
            r3 = requests.get(f"{BASE_URL}/countdowns/{countdown_id}")
            if r3.status_code == 200:
                data2 = r3.json()
                if data2['time_left'] == time_left:
                    print("✓ Timer correctly paused (time didn't change)")
                else:
                    print(f"✗ Timer continued running: {data2['time_left']} seconds")
        return True
    else:
        print(f"Error: {r.text}")
        return False

def test_score_update(countdown_id):
    print("\n" + "=" * 50)
    print("Test 5: Update Score")
    print("=" * 50)
    r = requests.post(f"{BASE_URL}/countdowns/{countdown_id}/score", json={
        "team": "team1",
        "score": 5
    })
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        r2 = requests.get(f"{BASE_URL}/countdowns/{countdown_id}")
        if r2.status_code == 200:
            data = r2.json()
            print(f"Team 1 score: {data['team1_score']}")
            if data['team1_score'] == 5:
                print("✓ Score updated correctly")
            else:
                print(f"✗ Score mismatch: expected 5, got {data['team1_score']}")
        return True
    else:
        print(f"Error: {r.text}")
        return False

async def test_websocket(countdown_id):
    print("\n" + "=" * 50)
    print("Test 6: WebSocket Connection")
    print("=" * 50)
    try:
        uri = f"{WS_BASE}/ws/countdowns/{countdown_id}"
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✓ WebSocket connected")
            
            # Wait for initial message
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Received initial update: {data['type']}")
            if 'data' in data:
                print(f"  Time left: {data['data']['time_left']} seconds")
                print(f"  State: {data['data']['state']}")
            
            # Start countdown and wait for updates
            print("\nStarting countdown via API...")
            requests.post(f"{BASE_URL}/countdowns/{countdown_id}/start")
            
            # Wait for a few updates
            updates_received = 0
            for _ in range(3):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(message)
                    if data.get('type') == 'update' and 'data' in data:
                        updates_received += 1
                        print(f"  Update {updates_received}: {data['data']['time_left']} seconds left")
                except asyncio.TimeoutError:
                    print("  No update received (timeout)")
                    break
            
            if updates_received > 0:
                print(f"✓ Received {updates_received} real-time updates")
            else:
                print("✗ No updates received")
                
    except Exception as e:
        print(f"✗ WebSocket error: {e}")
        return False
    return True

def main():
    print("\n" + "=" * 50)
    print("COUNTDOWN API TEST SUITE")
    print("=" * 50 + "\n")
    
    # Test 1: Create countdown
    countdown_id = test_create_countdown()
    if not countdown_id:
        print("Failed to create countdown. Aborting tests.")
        return
    
    # Test 2: Get countdown
    if not test_get_countdown(countdown_id):
        print("Failed to get countdown. Aborting tests.")
        return
    
    # Test 3: Start countdown
    test_start_countdown(countdown_id)
    
    # Test 4: Pause countdown
    test_pause_countdown(countdown_id)
    
    # Test 5: Update score
    test_score_update(countdown_id)
    
    # Test 6: WebSocket
    if HAS_WEBSOCKETS:
        asyncio.run(test_websocket(countdown_id))
    else:
        print("\n" + "=" * 50)
        print("Test 6: WebSocket Connection (SKIPPED - module not available)")
        print("=" * 50)
    
    print("\n" + "=" * 50)
    print("TEST SUITE COMPLETE")
    print("=" * 50)
    print(f"\nTest countdown ID: {countdown_id}")
    print(f"View at: http://127.0.0.1:8003/countdown/{countdown_id}")

if __name__ == "__main__":
    main()

