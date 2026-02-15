#include <Arduino.h>
#include <WiFi.h>
#include "api_client.h"
#include "print_client.h"

void setup()
{
  Serial.begin(115200);
  apiClientSetup();
  printClientSetup();
}

void loop()
{
  apiClientLoop();
  printClientLoop();
}
