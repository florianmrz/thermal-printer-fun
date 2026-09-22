#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>

// Initialize WiFi and the API client
void apiClientSetup();

// Poll the API for new print jobs and handle WiFi reconnection
void apiClientLoop();

// Whether the most recent poll of the API succeeded
bool isApiReachable();

#endif // API_CLIENT_H
