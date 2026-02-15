#ifndef PRINT_CLIENT_H
#define PRINT_CLIENT_H

#include <Arduino.h>
#include <vector>

// Initialize the USB printer client
void printClientSetup();

// Poll USB events and handle printing
void printClientLoop();

// Trigger a print job with the given data
void triggerPrint(const std::vector<uint8_t> &printData);

#endif // PRINT_CLIENT_H
