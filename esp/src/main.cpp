#include <Arduino.h>
#include <WiFi.h>
#include "api_client.h"
#include "print_client.h"
#include "led_status.h"

void setup()
{
  Serial.begin(115200);
  ledStatusSetup();
  apiClientSetup();
  printClientSetup();
}

void loop()
{
  apiClientLoop();
  printClientLoop();
  updateLEDStatus();
}
