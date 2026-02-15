#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <vector>

// Initialize the API client and WebSocket connection
void apiClientSetup();

// Poll WebSocket and handle reconnection logic
void apiClientLoop();

// Fetch print data from API and return as vector of byte arrays (72 bytes each)
std::vector<std::vector<uint8_t>> getPrintData();

#endif // API_CLIENT_H
