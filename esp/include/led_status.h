#ifndef LED_STATUS_H
#define LED_STATUS_H

#include <Arduino.h>

void ledStatusSetup();

void updateLEDStatus();

bool isWiFiConnected();

#endif // LED_STATUS_H
